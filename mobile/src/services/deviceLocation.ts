import { approximateLocation } from "./weatherApi";

export type ApproximateCoordinates = { lat: number; lon: number };
type Permission = { granted: boolean; canAskAgain: boolean };
export type DeviceLocationProvider = {
  getPermission: () => Promise<Permission>;
  requestPermission: () => Promise<Permission>;
  getPosition: () => Promise<unknown>;
};

export class DeviceLocationError extends Error {
  constructor(
    public readonly code: "PERMISSION" | "UNAVAILABLE" | "STALE" | "TIMEOUT",
    message: string,
  ) {
    super(message);
    this.name = "DeviceLocationError";
  }
}

function cancelled(): Error {
  const error = new Error("Consulta cancelada");
  error.name = "AbortError";
  return error;
}

function checkSignal(signal?: AbortSignal) {
  if (signal?.aborted) throw cancelled();
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeDevicePosition(
  position: unknown,
  now = Date.now(),
): ApproximateCoordinates {
  if (
    !object(position) ||
    !object(position.coords) ||
    typeof position.coords.latitude !== "number" ||
    typeof position.coords.longitude !== "number"
  ) {
    throw new DeviceLocationError(
      "UNAVAILABLE",
      "A localização está indisponível. Escolha um município.",
    );
  }
  if (
    typeof position.timestamp !== "number" ||
    !Number.isFinite(position.timestamp) ||
    now - position.timestamp > 5 * 60 * 1000 ||
    position.timestamp - now > 60000
  ) {
    throw new DeviceLocationError(
      "STALE",
      "A posição disponível não é recente. Tente novamente ou escolha um município.",
    );
  }
  try {
    const location = approximateLocation({
      label: "Localização aproximada",
      origin: "gps",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    return { lat: location.latitude, lon: location.longitude };
  } catch {
    throw new DeviceLocationError(
      "UNAVAILABLE",
      "A localização está indisponível. Escolha um município.",
    );
  }
}

function readPosition(
  provider: DeviceLocationProvider,
  signal?: AbortSignal,
): Promise<unknown> {
  checkSignal(signal);
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new DeviceLocationError(
          "TIMEOUT",
          "A localização demorou demais. Escolha um município ou tente novamente.",
        ),
      );
    }, 20000);
    signal?.addEventListener("abort", abort, { once: true });
    try {
      void provider.getPosition().then(
        (value) => {
          cleanup();
          resolve(value);
        },
        () => {
          cleanup();
          reject(
            new DeviceLocationError(
              "UNAVAILABLE",
              "Não foi possível obter a localização. Escolha um município.",
            ),
          );
        },
      );
    } catch {
      cleanup();
      reject(
        new DeviceLocationError(
          "UNAVAILABLE",
          "Não foi possível obter a localização. Escolha um município.",
        ),
      );
    }
  });
}

export async function requestApproximateDeviceLocation(
  provider: DeviceLocationProvider,
  signal?: AbortSignal,
): Promise<ApproximateCoordinates> {
  try {
    checkSignal(signal);
    let permission = await provider.getPermission();
    checkSignal(signal);
    if (!permission.granted && permission.canAskAgain) {
      permission = await provider.requestPermission();
      checkSignal(signal);
    }
    if (!permission.granted)
      throw new DeviceLocationError(
        "PERMISSION",
        "Localização não autorizada. Você pode escolher um município.",
      );
    const position = await readPosition(provider, signal);
    checkSignal(signal);
    return sanitizeDevicePosition(position);
  } catch (error) {
    checkSignal(signal);
    if (error instanceof DeviceLocationError) throw error;
    throw new DeviceLocationError(
      "UNAVAILABLE",
      "Não foi possível obter a localização. Escolha um município.",
    );
  }
}
