import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
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
import { useLanguage } from "../i18n/LanguageContext";
import { useCropCalendar } from "../hooks/useCropCalendar";
import HomeSheets, { type HomePanel } from "../components/home/HomeSheets";

export default function HomeScreen({ navigation, onEndSession }: any) {
  const { t } = useLanguage();
  const [panel, setPanel] = useState<HomePanel>(null);
  const [analysisContext, setAnalysisContext] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
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

  const calendar = useCropCalendar(selectedCrop, weatherLocation);
  const analysisKey = `${selectedCrop}:${weatherLocation?.latitude}:${weatherLocation?.longitude}`;

  function chooseMunicipality() {
    setPanel(null);
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
    setAnalysisError(null);
    setAnalysisContext(analysisKey);
    if (!weatherLocation) {
      chooseMunicipality();
      return;
    }

    if (
      weatherLocation.origin === "gps" &&
      !/^https:\/\//i.test(apiClient.defaults.baseURL ?? "")
    ) {
      setAnalysisError(
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
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            location={
              weatherLocation?.origin === "gps"
                ? t("Localização aproximada")
                : (weatherLocation?.label ?? t("Município"))
            }
            cropType={selectedCrop}
            onProfilePress={() => navigation.navigate("Profile")}
            onSettingsPress={() => setPanel("settings")}
            onTermsPress={() => setPanel("terms")}
            onLogoutPress={() => setPanel("logout")}
            onLocationPress={chooseMunicipality}
            onCropPress={() => setIsSheetVisible(true)}
          />

          <View style={styles.clockContainer}>
            <CropClockWidget
              crop={selectedCrop}
              calendar={calendar.calendar}
              window={calendar.window}
              loading={calendar.loading}
              error={calendar.error}
              hasLocation={!!weatherLocation}
              onSelectWindow={calendar.selectWindow}
              onRetry={calendar.retry}
            />
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
            onSoilPress={() => setPanel("soil")}
            onRotationsPress={() => navigation.navigate("RotationResult")}
            onAnalyzePress={() => setPanel("risk")}
            isLoading={loading || isLoadingLocation}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("Como posso te ajudar hoje?")}
            onPress={() => navigation.navigate("ChatAgent")}
          >
            <ChatBotInput />
          </TouchableOpacity>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate("Camera")}
              accessibilityRole="button"
            >
              <Text style={styles.cameraButtonText}>
                {t("Diagnóstico da folha")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <HomeSheets
          panel={panel}
          onClose={() => setPanel(null)}
          onLogout={onEndSession}
          onAnalyze={handleAnalyzeNASA}
          onChooseLocation={chooseMunicipality}
          hasLocation={!!weatherLocation}
          location={weatherLocation?.label ?? t("Município")}
          crop={selectedCrop}
          loading={loading}
          analysis={analysisContext === analysisKey ? data : null}
          error={
            analysisContext === analysisKey ? analysisError || error : null
          }
        />
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
  scroll: { flex: 1 },
  weatherContainer: { alignItems: "center", marginBottom: 20 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  clockContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
