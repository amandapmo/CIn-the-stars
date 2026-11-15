import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useAppLocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada pelo usuário.');
        setIsLoadingLocation(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setCoords({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch (err) {
        setErrorMsg('Falha ao buscar as coordenadas do GPS.');
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  return { coords, errorMsg, isLoadingLocation };
};