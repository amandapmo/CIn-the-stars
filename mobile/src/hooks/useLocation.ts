import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { requestApproximateDeviceLocation } from "../services/deviceLocation";
import type { ApproximateCoordinates } from "../services/deviceLocation";

const provider = {
  getPermission: Location.getForegroundPermissionsAsync,
  requestPermission: Location.requestForegroundPermissionsAsync,
  getPosition: () =>
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
      mayShowUserSettingsDialog: false,
    }),
};

export const useAppLocation = () => {
  const [coords, setCoords] = useState<ApproximateCoordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  const cancelLocation = useCallback(() => {
    active.current?.abort();
    setCoords(null);
    setIsLoadingLocation(false);
    setErrorMsg(null);
  }, []);

  const requestLocation =
    useCallback(async (): Promise<ApproximateCoordinates | null> => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setCoords(null);
      setErrorMsg(null);
      setIsLoadingLocation(true);
      try {
        const approximate = await requestApproximateDeviceLocation(
          provider,
          controller.signal,
        );
        if (controller.signal.aborted) return null;
        setCoords(approximate);
        return approximate;
      } catch (error) {
        if (!controller.signal.aborted)
          setErrorMsg(
            error instanceof Error
              ? error.message
              : "Localização indisponível. Escolha um município.",
          );
        return null;
      } finally {
        if (!controller.signal.aborted) setIsLoadingLocation(false);
      }
    }, []);

  return {
    coords,
    errorMsg,
    isLoadingLocation,
    requestLocation,
    cancelLocation,
  };
};
