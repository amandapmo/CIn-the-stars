const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  getWeatherForecast,
  searchWeatherCities,
} = require("../.expo/weather-tests/services/weatherApi.js");

const location = {
  label: "Recife, PE",
  latitude: -8.0476,
  longitude: -34.877,
  origin: "city",
};
function fixture() {
  return {
    timezone: "America/Recife",
    daily_units: {
      temperature_2m_max: "°C",
      temperature_2m_min: "°C",
      precipitation_probability_max: "%",
      precipitation_sum: "mm",
    },
    daily: {
      time: ["2026-11-15", "2026-11-16"],
      weather_code: [61, null],
      temperature_2m_max: [30, null],
      temperature_2m_min: [24, null],
      precipitation_probability_max: [70, null],
      precipitation_sum: [2.4, null],
    },
  };
}
function respond(data) {
  return mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify(data), { status: 200 }),
  );
}
afterEach(() => mock.restoreAll());

test("forecast preserves local calendar dates and missing values, and minimizes the transmitted location", async () => {
  const fetch = respond(fixture());
  const result = await getWeatherForecast(location);
  assert.equal(result.timezone, "America/Recife");
  assert.equal(result.days[0].date, "2026-11-15");
  assert.equal(result.days[0].precipitationMm, 2.4);
  assert.equal(result.days[1].temperatureMax, null);
  assert.equal(result.days[1].precipitationProbability, null);
  const url = new URL(fetch.mock.calls[0].arguments[0]);
  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.searchParams.get("latitude"), "-8.05");
  assert.equal(url.searchParams.get("longitude"), "-34.88");
  assert.equal(url.searchParams.get("forecast_days"), "15");
  assert.equal(url.searchParams.get("timezone"), "auto");
  assert.equal(url.searchParams.has("label"), false);
  assert.deepEqual(
    [...url.searchParams.keys()].sort(),
    [
      "latitude",
      "longitude",
      "daily",
      "timezone",
      "forecast_days",
      "temperature_unit",
      "precipitation_unit",
    ].sort(),
  );
});

test("invalid coordinates and forecast periods never make an external request", async () => {
  const fetch = respond(fixture());
  for (const latitude of [NaN, Infinity, 91, -91]) {
    await assert.rejects(getWeatherForecast({ ...location, latitude }), {
      code: "INPUT",
    });
  }
  await assert.rejects(getWeatherForecast({ ...location, longitude: 181 }), {
    code: "INPUT",
  });
  for (const days of [0, 17, 2.5])
    await assert.rejects(getWeatherForecast(location, { days }), {
      code: "INPUT",
    });
  assert.equal(fetch.mock.callCount(), 0);
});

test("malformed forecasts cannot be presented as complete weather data", async () => {
  const invalid = [
    (data) => {
      data.daily.temperature_2m_min.pop();
    },
    (data) => {
      data.daily_units.temperature_2m_max = "°F";
    },
    (data) => {
      data.daily.precipitation_probability_max[0] = 101;
    },
    (data) => {
      data.daily.precipitation_sum[0] = -1;
    },
    (data) => {
      data.daily.time[0] = "2026-02-30";
    },
    (data) => {
      data.daily.time.reverse();
    },
    (data) => {
      data.daily.temperature_2m_min[0] = 35;
    },
    (data) => {
      data.timezone = "";
    },
    (data) => {
      data.timezone = "Invalid/Timezone";
    },
  ];
  for (const change of invalid) {
    mock.restoreAll();
    const data = fixture();
    change(data);
    respond(data);
    await assert.rejects(getWeatherForecast(location), { code: "RESPONSE" });
  }
});

test("HTTP failures and network errors do not create fallback forecasts", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("busy", { status: 429 }),
  );
  await assert.rejects(getWeatherForecast(location), { code: "HTTP" });
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(getWeatherForecast(location), { code: "NETWORK" });
});

test("an already cancelled request sends no network request", async () => {
  const fetch = respond(fixture());
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    getWeatherForecast(location, { signal: controller.signal }),
    { name: "AbortError" },
  );
  assert.equal(fetch.mock.callCount(), 0);
});

test("cancellation aborts an in-flight provider request", async () => {
  const controller = new AbortController();
  let upstreamSignal;
  mock.method(
    globalThis,
    "fetch",
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        upstreamSignal = signal;
        signal.addEventListener(
          "abort",
          () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          { once: true },
        );
      }),
  );
  const request = getWeatherForecast(location, { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.equal(upstreamSignal.aborted, true);
});

test("city search sends only the query and display options, and returns approximate municipal coordinates", async () => {
  const fetch = respond({
    results: [
      {
        name: "Recife",
        admin1: "Pernambuco",
        country_code: "BR",
        latitude: -8.0476,
        longitude: -34.877,
      },
    ],
  });
  const [city] = await searchWeatherCities(" Recife ");
  assert.equal(city.label, "Recife, Pernambuco, BR");
  assert.equal(city.latitude, -8.05);
  assert.equal(city.origin, "city");
  const url = new URL(fetch.mock.calls[0].arguments[0]);
  assert.equal(url.origin, "https://geocoding-api.open-meteo.com");
  assert.deepEqual(
    [...url.searchParams.keys()].sort(),
    ["name", "count", "language", "format"].sort(),
  );
  assert.equal(url.searchParams.get("name"), "Recife");
});

test("a stalled provider request times out instead of leaving the screen loading indefinitely", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  mock.method(
    globalThis,
    "fetch",
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          { once: true },
        );
      }),
  );
  const request = getWeatherForecast(location);
  const rejection = assert.rejects(request, { code: "TIMEOUT" });
  context.mock.timers.tick(12000);
  await rejection;
});

test("no search results returns an empty list instead of a made-up location", async () => {
  respond({ generationtime_ms: 0.2 });
  assert.deepEqual(await searchWeatherCities("Unknown"), []);
});

test("worldwide search distinguishes same-name places by region and country without a Brazil-only filter", async () => {
  const fetch = respond({
    results: [
      {
        name: "Paris",
        admin1: "Île-de-France",
        country: "França",
        country_code: "FR",
        latitude: 48.85,
        longitude: 2.35,
      },
      {
        name: "Paris",
        admin1: "Texas",
        country: "Estados Unidos",
        country_code: "US",
        latitude: 33.66,
        longitude: -95.55,
      },
    ],
  });
  const cities = await searchWeatherCities("Paris");
  assert.equal(cities[0].label, "Paris, Île-de-France, França");
  assert.equal(cities[1].label, "Paris, Texas, Estados Unidos");
  const url = new URL(fetch.mock.calls[0].arguments[0]);
  assert.equal(url.searchParams.get("count"), "20");
  assert.equal(url.searchParams.has("countryCode"), false);
});

test("worldwide search preserves non-Latin names and country qualifiers", async () => {
  const fetch = respond({
    results: [
      {
        name: "Tóquio",
        country: "Japão",
        country_code: "JP",
        latitude: 35.69,
        longitude: 139.69,
      },
    ],
  });
  const [city] = await searchWeatherCities("東京, 日本");
  assert.equal(city.label, "Tóquio, Japão");
  assert.equal(
    new URL(fetch.mock.calls[0].arguments[0]).searchParams.get("name"),
    "東京, 日本",
  );
});
