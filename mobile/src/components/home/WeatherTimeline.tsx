import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { WeatherState } from "../../hooks/useWeatherForecast";
import type { WeatherDay, WeatherLocation } from "../../types/weather";
import { useLanguage } from "../../i18n/LanguageContext";

const DEMO: WeatherLocation = {
  label: "Recife, PE",
  latitude: -8.05,
  longitude: -34.88,
  origin: "demo",
};

function condition(code: number | null): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Céu limpo" };
  if (code === 1 || code === 2)
    return { icon: "⛅", label: "Parcialmente nublado" };
  if (code === 3) return { icon: "☁️", label: "Nublado" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Nevoeiro" };
  if (code !== null && [51, 53, 55, 56, 57].includes(code))
    return { icon: "🌦️", label: "Garoa" };
  if (code !== null && [61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { icon: "🌧️", label: "Chuva" };
  if (code !== null && [71, 73, 75, 77, 85, 86].includes(code))
    return { icon: "❄️", label: "Neve" };
  if (code !== null && [95, 96, 99].includes(code))
    return { icon: "⛈️", label: "Trovoadas" };
  return { icon: "—", label: "Condição indisponível" };
}

const temperature = (value: number | null) =>
  value === null ? "—" : `${Math.round(value)}°C`;

function Day({ day, width }: { day: WeatherDay; width: number }) {
  const { locale, t } = useLanguage();
  const date = new Date(`${day.date}T12:00:00Z`);
  const weekday = date.toLocaleDateString(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const displayDate = date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
  const weather = condition(day.code);
  return (
    <View
      style={[styles.day, { width }]}
      accessible
      accessibilityLabel={`${weekday}, ${displayDate}. ${t(weather.label)}. ${t("Máxima")} ${temperature(day.temperatureMax)}, ${t("mínima")} ${temperature(day.temperatureMin)}. ${t("Probabilidade de precipitação")} ${day.precipitationProbability === null ? t("indisponível") : day.precipitationProbability.toLocaleString(locale) + "%"}. ${t("Precipitação prevista")} ${day.precipitationMm === null ? t("indisponível") : day.precipitationMm.toLocaleString(locale) + " " + t("milímetros")}.`}
    >
      <Text maxFontSizeMultiplier={1.6} style={styles.dayTitle}>
        {weekday}
      </Text>
      <Text maxFontSizeMultiplier={1.6} style={styles.date}>
        {displayDate}
      </Text>
      <Text style={styles.icon} accessibilityElementsHidden>
        {weather.icon}
      </Text>
      <Text maxFontSizeMultiplier={1.6} style={styles.maximum}>
        {temperature(day.temperatureMax)}
      </Text>
      <Text maxFontSizeMultiplier={1.6} style={styles.minimum}>
        {temperature(day.temperatureMin)}
      </Text>
      <Text maxFontSizeMultiplier={1.6} style={styles.rain}>
        {day.precipitationProbability === null
          ? "—"
          : `${Math.round(day.precipitationProbability)}%`}
      </Text>
    </View>
  );
}

export default function WeatherTimeline({
  width,
  state,
  onLoad,
  onChooseMunicipality,
  onUseDeviceLocation,
  isLoadingLocation,
  locationError,
}: {
  width: number;
  state: WeatherState;
  onLoad: (location: WeatherLocation) => void;
  onChooseMunicipality: () => void;
  onUseDeviceLocation: () => void;
  isLoadingLocation: boolean;
  locationError: string | null;
}) {
  const { locale, t } = useLanguage();
  const { fontScale } = useWindowDimensions();
  const [linkError, setLinkError] = useState("");
  const location =
    state.status === "success"
      ? state.forecast.location
      : state.status === "idle"
        ? null
        : state.location;

  function selectLocation(selected: WeatherLocation) {
    onLoad(selected);
  }

  function openSource(url: string) {
    setLinkError("");
    void Linking.openURL(url).catch(() =>
      setLinkError("Não foi possível abrir o link."),
    );
  }

  return (
    <LinearGradient
      colors={["rgba(116,139,124,0.25)", "rgba(102,135,181,0.25)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.panel, { width, borderRadius: 22 }]}
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {t("Previsão do tempo")}
        </Text>
        {state.status === "success" && (
          <Text style={styles.caption}>
            {state.forecast.days.length} {t("dias")}
          </Text>
        )}
      </View>
      {location && (
        <Text style={styles.caption}>
          {location.origin === "gps"
            ? t("Localização aproximada")
            : location.label}
          {location.origin === "demo" ? ` · ${t("demonstração")}` : ""}
        </Text>
      )}
      {state.status === "idle" && (
        <>
          <Text style={styles.caption}>
            {t(
              "Escolha seu município ou use a localização aproximada do aparelho.",
            )}
          </Text>
          <Text style={styles.privacy}>
            {t(
              "A Open-Meteo recebe o município pesquisado, coordenadas aproximadas e o IP da conexão. Sua escolha fica apenas nesta sessão do app.",
            )}
          </Text>
        </>
      )}
      {state.status === "loading" && (
        <View style={styles.loading}>
          <ActivityIndicator
            color="#f4d67d"
            accessibilityLabel={t("Carregando previsão")}
          />
          <Text accessibilityLiveRegion="polite" style={styles.caption}>
            {t("Consultando previsão…")}
          </Text>
        </View>
      )}
      {state.status === "error" && (
        <>
          <Text accessibilityRole="alert" style={styles.caption}>
            {t(state.message)}
          </Text>
          {state.location && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (state.location) onLoad(state.location);
              }}
              style={styles.button}
            >
              <Text style={styles.buttonLabel}>{t("Tentar novamente")}</Text>
            </Pressable>
          )}
        </>
      )}
      {state.status === "success" && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
          >
            {state.forecast.days.map((day) => (
              <Day
                key={day.date}
                day={day}
                width={Math.max(width * 0.16, 70) * Math.min(fontScale, 1.6)}
              />
            ))}
          </ScrollView>
          <Text style={styles.small}>
            {t("Máxima / mínima · probabilidade de precipitação · deslize →")}
          </Text>
          <Text style={styles.small}>
            {t("Consultado em")}{" "}
            {new Date(state.forecast.retrievedAt).toLocaleString(locale, {
              timeZone: state.forecast.timezone,
            })}{" "}
            ({state.forecast.timezone})
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onLoad(state.forecast.location)}
            style={styles.secondary}
          >
            <Text style={styles.link}>{t("Atualizar previsão")}</Text>
          </Pressable>
        </>
      )}
      <Text style={styles.privacy}>
        {t(
          "A localização do aparelho só é solicitada ao tocar no botão e permitir o acesso. Usamos coordenadas aproximadas, mantidas só nesta sessão do app. A posição só muda quando você solicitar novamente. O provedor informa retenção de registros por até 90 dias.",
        )}
      </Text>
      <Text style={styles.privacy}>
        {t(
          "Se você pedir a análise agrícola, esse ponto aproximado também será enviado à API do projeto, com conexão HTTPS.",
        )}
      </Text>
      <Text style={styles.privacy}>
        {t(
          "O calendário usa o país e a região. Quando essas informações faltarem, o servidor consulta a localização aproximada no Nominatim/OpenStreetMap e mantém o resultado por até uma hora. A FAO recebe apenas o país consultado.",
        )}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onUseDeviceLocation}
        disabled={isLoadingLocation}
        style={[styles.secondary, isLoadingLocation && { opacity: 0.6 }]}
      >
        {isLoadingLocation && (
          <ActivityIndicator
            color="#f4d67d"
            accessibilityLabel={t("Obtendo localização aproximada")}
          />
        )}
        <Text style={styles.link}>
          {isLoadingLocation
            ? t("Obtendo localização…")
            : t("Usar minha localização aproximada")}
        </Text>
      </Pressable>
      {!!locationError && (
        <Text accessibilityRole="alert" style={styles.caption}>
          {t(locationError)}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onChooseMunicipality}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>
          {t(location ? "Trocar município" : "Escolher município")}
        </Text>
      </Pressable>
      {state.status === "idle" && (
        <Pressable
          accessibilityRole="button"
          onPress={() => selectLocation(DEMO)}
          style={styles.secondary}
        >
          <Text style={styles.link}>
            {t("Testar Recife, PE (demonstração)")}
          </Text>
        </Pressable>
      )}
      <View style={styles.attribution}>
        <Pressable
          accessibilityRole="link"
          onPress={() => openSource("https://www.geonames.org/")}
          style={styles.source}
        >
          <Text style={styles.small}>{t("Localidades: GeoNames")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => openSource("https://open-meteo.com/")}
          style={styles.source}
        >
          <Text style={styles.small}>{t("Dados: Open-Meteo")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            openSource("https://creativecommons.org/licenses/by/4.0/")
          }
          style={styles.source}
        >
          <Text style={styles.small}>CC BY 4.0</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => openSource("https://open-meteo.com/en/terms#privacy")}
          style={styles.source}
        >
          <Text style={styles.small}>{t("Privacidade do serviço")}</Text>
        </Pressable>
      </View>
      {!!linkError && (
        <Text accessibilityLiveRegion="polite" style={styles.caption}>
          {t(linkError)}
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(220,232,190,0.18)",
  },
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { color: "#f3f1d9", fontSize: 16, fontWeight: "600" },
  caption: { color: "#e0e5ce", fontSize: 13, lineHeight: 19 },
  privacy: { color: "#d3ddcd", fontSize: 12, lineHeight: 18 },
  loading: { paddingVertical: 18, alignItems: "center", gap: 10 },
  days: { gap: 8 },
  day: {
    backgroundColor: "rgba(25,58,46,0.35)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 4,
  },
  dayTitle: { color: "#f3edcd", fontSize: 13, fontWeight: "600" },
  date: { color: "#d1dccb", fontSize: 11 },
  icon: { fontSize: 26, lineHeight: 36 },
  maximum: { color: "#ffdf7d", fontWeight: "600", fontSize: 14 },
  minimum: { color: "#d5e4df", fontSize: 12 },
  rain: { color: "#bde2e8", fontSize: 11 },
  small: { color: "#c7d4c3", fontSize: 11, lineHeight: 16 },
  button: {
    backgroundColor: "#f4d67d",
    padding: 11,
    borderRadius: 22,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: { color: "#294c40", fontWeight: "600", fontSize: 13 },
  secondary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  link: { color: "#f4d67d", fontSize: 12, textAlign: "center" },
  attribution: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 12,
  },
  source: { minHeight: 44, justifyContent: "center" },
});
