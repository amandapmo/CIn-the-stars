import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../i18n/LanguageContext";

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

export default function RotationResultScreen({ navigation }: any) {
  const { locale, t } = useLanguage();
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
  ) =>
    value == null
      ? t("Indisponível")
      : `${value.toLocaleString(locale)}${suffix}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Voltar")}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← {t("Voltar")}</Text>
        </Pressable>
        <Text style={styles.brand}>CIn the Stars</Text>
        <Text style={styles.title}>{t("Cenários de rotação")}</Text>
        <Text style={styles.demo}>
          {t(
            "DEMONSTRAÇÃO — Resultados de exemplo, não saídas atuais do modelo",
          )}
        </Text>
        <View style={styles.selector}>
          {(["A", "B"] as const).map((id) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === id }}
              aria-pressed={selected === id}
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
                {t("Cenário")} {id}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("Tempo atual")}</Text>
          {weatherStatus === "loading" && (
            <Text style={styles.body}>{t("Carregando o tempo atual...")}</Text>
          )}
          {weatherStatus === "error" && (
            <Text style={styles.body}>
              {t(
                "O tempo atual está temporariamente indisponível. Confira a conexão e a configuração do serviço de clima.",
              )}
            </Text>
          )}
          {weatherStatus === "ready" && weather && (
            <>
              <Text style={styles.body}>
                {t("Temperatura:")}{" "}
                {formatWeatherValue(weather.temperature_c, "°C")}
              </Text>
              <Text style={styles.body}>
                {t("Sensação térmica:")}{" "}
                {formatWeatherValue(weather.feels_like_c, "°C")}
              </Text>
              <Text style={styles.body}>
                {t("Umidade:")}{" "}
                {formatWeatherValue(weather.humidity_percent, "%")}
              </Text>
              <Text style={styles.body}>
                {t("Condição:")}{" "}
                {weather.condition ? t(weather.condition) : t("Indisponível")}
              </Text>
              <Text style={styles.body}>
                {t("Probabilidade de precipitação:")}{" "}
                {formatWeatherValue(
                  weather.precipitation_probability_percent,
                  "%",
                )}
              </Text>
              <Text style={styles.body}>
                {t("Precipitação na última hora:")}{" "}
                {formatWeatherValue(weather.precipitation_mm, " mm")}
              </Text>
              <Text style={styles.body}>
                {t("Velocidade do vento:")}{" "}
                {formatWeatherValue(weather.wind_speed_kmh, " km/h")}
              </Text>
              <Text style={styles.body}>
                {t("Observado em (UTC):")}{" "}
                {weather.observed_at &&
                Number.isFinite(Date.parse(weather.observed_at))
                  ? new Date(weather.observed_at).toLocaleString(locale, {
                      timeZone: "UTC",
                    })
                  : t("Indisponível")}
              </Text>
              <Text style={styles.body}>
                {t("Fuso horário:")} {weather.time_zone_id ?? t("Indisponível")}
              </Text>
            </>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>{t("CULTURA ANTERIOR")}</Text>
          <Text style={styles.value}>{t(scenario.input.previous_crop)}</Text>
          <Text style={styles.label}>{t("CULTURA SUGERIDA")}</Text>
          <Text style={styles.crop}>{t(result.suggested_crop)}</Text>
          <Text style={styles.label}>{t("RISCO DE GEADA")}</Text>
          <Text
            style={[styles.risk, { color: isHighRisk ? "#B91C1C" : "#166534" }]}
          >
            {t(isHighRisk ? "Alto" : "Nenhum")}
          </Text>
          {isFallow && (
            <Text style={styles.warning}>
              {t("Nenhum plantio recomendado nesta demonstração.")}
            </Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t("Justificativa agronômica")}
          </Text>
          <Text style={styles.body}>{t(result.justification)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("Entradas do cenário")}</Text>
          <Text style={styles.body}>
            {t("Latitude:")}{" "}
            {scenario.input.lat.toLocaleString(locale, {
              maximumFractionDigits: 4,
            })}
          </Text>
          <Text style={styles.body}>
            {t("Longitude:")}{" "}
            {scenario.input.lon.toLocaleString(locale, {
              maximumFractionDigits: 4,
            })}
          </Text>
          <Text style={styles.body}>
            {t("Mês de plantio:")} {scenario.input.planting_month}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("Critérios e limitações")}</Text>
          <Text style={styles.body}>
            {t(
              "Critérios exibidos: cultura anterior, cultura sugerida, risco de geada e justificativa do modelo.",
            )}
          </Text>
          <Text style={styles.body}>
            {t(
              "O contrato atual da API não fornece produtividade, lucro ou classificação comparativa.",
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 12,
  },
  backText: { color: "#173D2A", fontSize: 16, fontWeight: "600" },
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
