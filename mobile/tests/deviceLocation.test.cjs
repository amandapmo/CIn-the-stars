const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeDevicePosition,
  requestApproximateDeviceLocation,
} = require("../.expo/weather-tests/services/deviceLocation.js");

function rawPosition() {
  return {
    coords: {
      latitude: -8.047612,
      longitude: -34.877135,
      accuracy: 12,
      altitude: 80,
      altitudeAccuracy: 5,
      speed: 1.2,
      heading: 90,
    },
    timestamp: Date.now(),
    mocked: true,
    userId: "synthetic-test-identity",
  };
}
function provider(overrides = {}) {
  return {
    getPermission: mock.fn(async () => ({ granted: true, canAskAgain: true })),
    requestPermission: mock.fn(async () => ({
      granted: true,
      canAskAgain: true,
    })),
    getPosition: mock.fn(async () => rawPosition()),
    ...overrides,
  };
}
afterEach(() => mock.restoreAll());

test("device position exposes only approximate latitude/longitude, excluding all extra SDK metadata", () => {
  const raw = rawPosition();
  const result = sanitizeDevicePosition(raw);
  assert.deepEqual(result, { lat: -8.05, lon: -34.88 });
  assert.deepEqual(Object.keys(result).sort(), ["lat", "lon"]);
  assert.equal(raw.coords.accuracy, 12);
});

test("invalid or stale device positions cannot be forwarded as current locations", () => {
  for (const timestamp of [
    0,
    NaN,
    Date.now() - 6 * 60 * 1000,
    Date.now() + 120000,
  ]) {
    assert.throws(
      () => sanitizeDevicePosition({ ...rawPosition(), timestamp }),
      { code: "STALE" },
    );
  }
  for (const latitude of [Infinity, NaN, 91, -91]) {
    const raw = rawPosition();
    raw.coords.latitude = latitude;
    assert.throws(() => sanitizeDevicePosition(raw), { code: "UNAVAILABLE" });
  }
});

test("an existing foreground grant is reused without asking for new permission", async () => {
  const sdk = provider();
  assert.deepEqual(await requestApproximateDeviceLocation(sdk), {
    lat: -8.05,
    lon: -34.88,
  });
  assert.equal(sdk.requestPermission.mock.callCount(), 0);
  assert.equal(sdk.getPosition.mock.callCount(), 1);
});

test("permission is requested before acquisition when it has not been granted", async () => {
  const calls = [];
  const sdk = provider({
    getPermission: async () => {
      calls.push("check");
      return { granted: false, canAskAgain: true };
    },
    requestPermission: async () => {
      calls.push("request");
      return { granted: true, canAskAgain: true };
    },
    getPosition: async () => {
      calls.push("capture");
      return rawPosition();
    },
  });
  await requestApproximateDeviceLocation(sdk);
  assert.deepEqual(calls, ["check", "request", "capture"]);
});

test("denial never acquires a position and a blocked permission is not repeatedly requested", async () => {
  for (const canAskAgain of [true, false]) {
    const sdk = provider({
      getPermission: async () => ({ granted: false, canAskAgain }),
      requestPermission: mock.fn(async () => ({ granted: false, canAskAgain })),
    });
    await assert.rejects(requestApproximateDeviceLocation(sdk), {
      code: "PERMISSION",
    });
    assert.equal(sdk.getPosition.mock.callCount(), 0);
    assert.equal(sdk.requestPermission.mock.callCount(), canAskAgain ? 1 : 0);
  }
});

test("permission or acquisition errors are replaced with public messages without SDK details", async () => {
  for (const method of ["getPermission", "getPosition"]) {
    const sdk = provider({
      [method]: async () => {
        throw new Error("private SDK coordinates and device metadata");
      },
    });
    await assert.rejects(requestApproximateDeviceLocation(sdk), (error) => {
      assert.equal(error.code, "UNAVAILABLE");
      assert.equal(error.message.includes("private SDK"), false);
      return true;
    });
  }
});

test("cancellation before a permission result prevents later position acquisition", async () => {
  const controller = new AbortController();
  let grant, markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const sdk = provider({
    getPermission: () =>
      new Promise((resolve) => {
        grant = resolve;
        markStarted();
      }),
  });
  const request = requestApproximateDeviceLocation(sdk, controller.signal);
  await started;
  controller.abort();
  grant({ granted: true, canAskAgain: true });
  await assert.rejects(request, { name: "AbortError" });
  assert.equal(sdk.getPosition.mock.callCount(), 0);
});

test("cancellation ignores a late native acquisition result", async () => {
  const controller = new AbortController();
  let finish, markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const sdk = provider({
    getPosition: () =>
      new Promise((resolve) => {
        finish = resolve;
        markStarted();
      }),
  });
  const request = requestApproximateDeviceLocation(sdk, controller.signal);
  await started;
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  finish(rawPosition());
});

test("a native acquisition which never returns has a bounded wait", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const sdk = provider({
    getPosition: () => {
      markStarted();
      return new Promise(() => {});
    },
  });
  const request = requestApproximateDeviceLocation(sdk);
  const rejection = assert.rejects(request, { code: "TIMEOUT" });
  await started;
  context.mock.timers.tick(20000);
  await rejection;
});
