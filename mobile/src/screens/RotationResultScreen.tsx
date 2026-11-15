import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

import { scenarios } from "../mocks/recommendationMock";
import { getCurrentWeather } from "../services/weatherApi";
import { CurrentWeather } from "../types/weather";

type ScenarioId = "A" | "B";
type WeatherStatus = "loading" | "ready" | "error";
type LoadedWeatherState = {
  location: string;
  status: "ready";
  weather: CurrentWeather;
};
type FailedWeatherState = {
  location: string;
  status: "error";
};

export default function RotationResultScreen() {
  const [selected, setSelected] = useState<ScenarioId>("A");
  const [loadedWeather, setLoadedWeather] = useState<
    LoadedWeatherState | FailedWeatherState | null
  >(null);

  const scenario = scenarios[selected];
  const location = `${scenario.input.lat},${scenario.input.lon}`;
  const result = scenario.result;
  const weatherStatus: WeatherStatus =
    loadedWeather?.location === location ? loadedWeather.status : "loading";
  const weather =
    loadedWeather?.location === location && loadedWeather.status === "ready"
      ? loadedWeather.weather
      : null;

  const isFallow = result.suggested_crop === "NONE (Climatic Fallow)";

  const isHighRisk = result.frost_risk === "High";

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    const timeout = setTimeout(() => {
      getCurrentWeather(
        scenario.input.lat,
        scenario.input.lon,
        controller.signal,
      )
        .then((currentWeather) => {
          if (isCurrentRequest) {
            setLoadedWeather({
              location,
              status: "ready",
              weather: currentWeather,
            });
          }
        })
        .catch(() => {
          if (isCurrentRequest && !controller.signal.aborted) {
            setLoadedWeather({ location, status: "error" });
          }
        });
    }, 250);

    return () => {
      isCurrentRequest = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [location, scenario.input.lat, scenario.input.lon]);

  const formatWeatherValue = (
    value: number | null | undefined,
    suffix: string,
  ) => (value == null ? "Unavailable" : `${value}${suffix}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>CIn the Stars</Text>
        <Text style={styles.title}>Rotation Scenarios</Text>

        <Text style={styles.demo}>
          DEMONSTRATION — Example results, not live model output
        </Text>

        <View style={styles.selector}>
          {(["A", "B"] as const).map((id) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === id }}
              style={[
                styles.selectorButton,
                selected === id && styles.activeButton,
              ]}
              onPress={() => setSelected(id)}
            >
              <Text
                style={[
                  styles.selectorText,
                  selected === id && styles.activeText,
                ]}
              >
                Scenario {id}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Weather</Text>
          {weatherStatus === "loading" && (
            <Text style={styles.body}>Loading current weather...</Text>
          )}
          {weatherStatus === "error" && (
            <Text style={styles.body}>
              Current weather is temporarily unavailable. Check your connection
              and weather service configuration.
            </Text>
          )}
          {weatherStatus === "ready" && weather && (
            <>
              <Text style={styles.body}>
                Temperature: {formatWeatherValue(weather.temperature_c, "°C")}
              </Text>
              <Text style={styles.body}>
                Feels like: {formatWeatherValue(weather.feels_like_c, "°C")}
              </Text>
              <Text style={styles.body}>
                Humidity: {formatWeatherValue(weather.humidity_percent, "%")}
              </Text>
              <Text style={styles.body}>
                Condition: {weather.condition ?? "Unavailable"}
              </Text>
              <Text style={styles.body}>
                Precipitation probability:{" "}
                {formatWeatherValue(
                  weather.precipitation_probability_percent,
                  "%",
                )}
              </Text>
              <Text style={styles.body}>
                Precipitation (last hour):{" "}
                {formatWeatherValue(weather.precipitation_mm, " mm")}
              </Text>
              <Text style={styles.body}>
                Wind speed: {formatWeatherValue(weather.wind_speed_kmh, " km/h")}
              </Text>
              <Text style={styles.body}>
                Observed at (UTC): {weather.observed_at ?? "Unavailable"}
              </Text>
              <Text style={styles.body}>
                Time zone: {weather.time_zone_id ?? "Unavailable"}
              </Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PREVIOUS CROP</Text>
          <Text style={styles.value}>{scenario.input.previous_crop}</Text>

          <Text style={styles.label}>SUGGESTED CROP</Text>
          <Text style={styles.crop}>{result.suggested_crop}</Text>

          <Text style={styles.label}>FROST RISK</Text>
          <Text
            style={[styles.risk, { color: isHighRisk ? "#B91C1C" : "#166534" }]}
          >
            {result.frost_risk}
          </Text>

          {isFallow && (
            <Text style={styles.warning}>
              No planting recommended in this demonstration.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Agronomic Justification</Text>
          <Text style={styles.body}>{result.justification}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scenario Inputs</Text>
          <Text style={styles.body}>Latitude: {scenario.input.lat}</Text>
          <Text style={styles.body}>Longitude: {scenario.input.lon}</Text>
          <Text style={styles.body}>
            Planting month: {scenario.input.planting_month}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Criteria and Limitations</Text>
          <Text style={styles.body}>
            Displayed criteria: previous crop, suggested crop, frost risk and
            model justification.
          </Text>
          <Text style={styles.body}>
            No yield, profit or comparative ranking is provided by the current
            API contract.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F1",
  },
  content: {
    padding: 24,
    paddingTop: 35,
    paddingBottom: 45,
  },
  brand: {
    color: "#407B55",
    fontWeight: "bold",
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#173D2A",
    marginTop: 8,
    marginBottom: 15,
  },
  demo: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 20,
  },
  selector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  selectorButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D5CA",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#207245",
    borderColor: "#207245",
  },
  selectorText: {
    color: "#173D2A",
    fontWeight: "bold",
  },
  activeText: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: 7,
  },
  value: {
    fontSize: 18,
    color: "#173D2A",
    marginBottom: 18,
  },
  crop: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#173D2A",
    marginBottom: 18,
  },
  risk: {
    fontSize: 18,
    fontWeight: "bold",
  },
  warning: {
    color: "#92400E",
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#173D2A",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "#334155",
    marginBottom: 8,
  },
});
