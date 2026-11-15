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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import TopBar from "../components/TopBar";
import CropClockWidget from "../components/CropClockWidget";
import ActionCards from "../components/ActionCards";
import ChatBotInput from "../components/ChatBotInput";
import CropSelectionSheet from "../components/CropSelectionSheet";
import WeatherTimeline from "../components/home/WeatherTimeline";
import WeatherLocationPicker from "../components/home/WeatherLocationPicker";

import { useRecommendation } from "../hooks/useRecommendation";
import { useWeatherForecast } from "../hooks/useWeatherForecast";
import { RecommendationRequest } from "../api/recommendation";

export default function HomeScreen({ navigation }: any) {
  const { fetchRecommendation, loading, data, error } = useRecommendation();
  const { width } = useWindowDimensions();
  const { state: weatherState, load: loadWeather } = useWeatherForecast();
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

  const handleAnalyzeNASA = () => {
    if (!weatherLocation) {
      setIsLocationPickerVisible(true);
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
            onLocationPress={() => setIsLocationPickerVisible(true)}
            onCropPress={() => setIsSheetVisible(true)}
          />

          <View style={styles.clockContainer}>
            <CropClockWidget />
          </View>

          <View style={styles.weatherContainer}>
            <WeatherTimeline
              width={Math.min(width - 32, 520)}
              state={weatherState}
              onLoad={loadWeather}
              onChooseMunicipality={() => setIsLocationPickerVisible(true)}
            />
          </View>

          <ActionCards onAnalyzePress={handleAnalyzeNASA} isLoading={loading} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate("ChatAgent")}>
            <ChatBotInput />
          </TouchableOpacity>
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
          onSelect={loadWeather}
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
  },
});
