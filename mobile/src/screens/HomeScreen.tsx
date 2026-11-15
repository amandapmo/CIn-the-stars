import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../utils/colors";

import TopBar from "../components/TopBar";
import CropClockWidget from "../components/CropClockWidget";
import ActionCards from "../components/ActionCards";
import ChatBotInput from "../components/ChatBotInput";
import CropSelectionSheet from "../components/CropSelectionSheet";
import WeatherTimeline from "../components/home/WeatherTimeline";
import WeatherLocationPicker from "../components/home/WeatherLocationPicker";

import { useRecommendation } from "../hooks/useRecommendation";
import { useWeatherForecast } from "../hooks/useWeatherForecast";
import { useAppLocation } from "../hooks/useLocation";
import type { WeatherLocation } from "../types/weather";
import { RecommendationRequest } from "../api/recommendation";
import apiClient from "../api/client";

export default function HomeScreen({ navigation }: any) {
  const { fetchRecommendation, loading, data, error } = useRecommendation();
  const { width } = useWindowDimensions();
  const { state: weatherState, load: loadWeather } = useWeatherForecast();
  const {
    requestLocation,
    cancelLocation,
    errorMsg: locationError,
    isLoadingLocation,
  } = useAppLocation();
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const weatherLocation =
    weatherState.status === "success"
      ? weatherState.forecast.location
      : weatherState.status === "idle"
        ? null
        : weatherState.location;

  const [selectedCrop, setSelectedCrop] =
    useState<RecommendationRequest["previous_crop"]>("Corn");
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  function chooseMunicipality() {
    cancelLocation();
    setIsLocationPickerVisible(true);
  }

  function loadSelectedWeather(location: WeatherLocation) {
    cancelLocation();
    loadWeather(location);
  }

  async function loadDeviceWeather() {
    const position = await requestLocation();
    if (position)
      loadWeather({
        label: "Localização aproximada",
        origin: "gps",
        latitude: position.lat,
        longitude: position.lon,
      });
  }

  const handleAnalyzeNASA = () => {
    if (!weatherLocation) {
      chooseMunicipality();
      return;
    }

    if (
      weatherLocation.origin === "gps" &&
      !/^https:\/\//i.test(apiClient.defaults.baseURL ?? "")
    ) {
      Alert.alert(
        "Conexão segura necessária",
        "A análise da localização do aparelho requer uma API com HTTPS. Você pode continuar consultando a previsão ou escolher um município.",
      );
      return;
    }

    const payload: RecommendationRequest = {
      lat: weatherLocation.latitude,
      lon: weatherLocation.longitude,
      planting_month: new Date().getMonth() + 1,
      previous_crop: selectedCrop,
    };

    fetchRecommendation(payload);
  };

  useEffect(() => {
    if (data) {
      Alert.alert("Análise Concluída", `Status: ${data.recommendation_status}`);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      Alert.alert("Aviso Científico", error);
    }
  }, [error]);

  return (
    <LinearGradient
      colors={["#6B8033", "#405B3A", "#243D51"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            location={weatherLocation?.label ?? "Município"}
            cropType={selectedCrop}
            onLocationPress={chooseMunicipality}
            onCropPress={() => setIsSheetVisible(true)}
          />

          <View style={styles.clockContainer}>
            <CropClockWidget />
          </View>

          <View style={styles.weatherContainer}>
            <WeatherTimeline
              width={Math.min(width - 32, 520)}
              state={weatherState}
              onLoad={loadSelectedWeather}
              onChooseMunicipality={chooseMunicipality}
              onUseDeviceLocation={() => {
                void loadDeviceWeather();
              }}
              isLoadingLocation={isLoadingLocation}
              locationError={locationError}
            />
          </View>

          <ActionCards
            onAnalyzePress={handleAnalyzeNASA}
            isLoading={loading || isLoadingLocation}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate("ChatAgent")}>
            <ChatBotInput />
          </TouchableOpacity>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate("Camera")}
              accessibilityRole="button"
            >
              <Text style={styles.cameraButtonText}>Diagnóstico da folha</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
              accessibilityRole="button"
            >
              <Text style={styles.cameraButtonText}>Meu Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CropSelectionSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          currentCrop={selectedCrop}
          onSelectCrop={(crop) =>
            setSelectedCrop(crop as RecommendationRequest["previous_crop"])
          }
        />
        <WeatherLocationPicker
          visible={isLocationPickerVisible}
          onClose={() => setIsLocationPickerVisible(false)}
          onSelect={loadSelectedWeather}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weatherContainer: { alignItems: "center", marginBottom: 20 },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  clockContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    gap: 10,
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cameraButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
});
