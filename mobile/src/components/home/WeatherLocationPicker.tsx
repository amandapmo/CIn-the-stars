import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchWeatherCities } from "../../services/weatherApi";
import type { WeatherLocation } from "../../types/weather";
import { useLanguage } from "../../i18n/LanguageContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: WeatherLocation) => void;
};

export default function WeatherLocationPicker({
  visible,
  onClose,
  onSelect,
}: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  function close() {
    active.current?.abort();
    setLoading(false);
    onClose();
  }

  function changeQuery(value: string) {
    active.current?.abort();
    setLoading(false);
    setQuery(value);
    setResults([]);
    setMessage("");
  }

  function search() {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setResults([]);
    setMessage("");
    void searchWeatherCities(query, controller.signal).then(
      (cities) => {
        if (controller.signal.aborted) return;
        setResults(cities);
        setLoading(false);
        if (!cities.length)
          setMessage(
            "Nenhum município encontrado. Confira o nome e tente novamente.",
          );
      },
      (error) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível buscar o município.",
        );
      },
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={styles.panel} accessibilityViewIsModal>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text accessibilityRole="header" style={styles.title}>
              {t("Escolher município")}
            </Text>
            <Text style={styles.body}>
              {t(
                "Buscamos pelo nome do município, sem usar GPS. Não informe endereço, nome da propriedade ou dados pessoais.",
              )}
            </Text>
            <Text style={styles.body}>
              {t(
                "Ao buscar, a Open-Meteo recebe o texto digitado e o IP da conexão. Ao selecionar um resultado, consultamos a previsão com coordenadas aproximadas do município.",
              )}
            </Text>
            <Text style={styles.body}>
              {t("A escolha fica apenas nesta sessão do app.")}
            </Text>
            <Text style={styles.body}>
              {t(
                "Busca mundial. Para distinguir nomes iguais, acrescente o estado ou país: Paris, França. Até 20 resultados por busca, conforme a base GeoNames.",
              )}
            </Text>
            <Text style={styles.body}>
              {t(
                "A Open-Meteo informa que registros do serviço podem conter coordenadas e são excluídos após 90 dias.",
              )}
            </Text>
            <View style={styles.sources}>
              <Pressable
                accessibilityRole="link"
                style={styles.source}
                onPress={() => {
                  void Linking.openURL("https://www.geonames.org/").catch(() =>
                    setMessage("Não foi possível abrir o link."),
                  );
                }}
              >
                <Text style={styles.hint}>{t("Localidades: GeoNames")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                style={styles.source}
                onPress={() => {
                  void Linking.openURL(
                    "https://open-meteo.com/en/docs/geocoding-api",
                  ).catch(() => setMessage("Não foi possível abrir o link."));
                }}
              >
                <Text style={styles.hint}>{t("Busca: Open-Meteo")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                style={styles.source}
                onPress={() => {
                  void Linking.openURL(
                    "https://open-meteo.com/en/terms#privacy",
                  ).catch(() => setMessage("Não foi possível abrir o link."));
                }}
              >
                <Text style={styles.hint}>{t("Política de privacidade")}</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel={t("Nome do município")}
              placeholder={t("Ex.: Recife ou Paris, França")}
              placeholderTextColor="#aabbac"
              value={query}
              onChangeText={changeQuery}
              maxLength={100}
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="search"
              onSubmitEditing={search}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              disabled={loading || query.trim().length < 2}
              onPress={search}
              style={[
                styles.button,
                (loading || query.trim().length < 2) && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>{t("Buscar município")}</Text>
            </Pressable>
            {loading && (
              <ActivityIndicator
                accessibilityLabel={t("Buscando municípios")}
                color="#f4d67d"
              />
            )}
            {!!message && (
              <Text accessibilityLiveRegion="polite" style={styles.body}>
                {t(message)}
              </Text>
            )}
            {results.map((location, index) => (
              <Pressable
                key={`${location.latitude}:${location.longitude}:${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${t("Consultar previsão para")} ${location.label}`}
                onPress={() => {
                  close();
                  onSelect(location);
                }}
                style={styles.result}
              >
                <Text style={styles.body}>{location.label}</Text>
                <Text style={styles.hint}>
                  {t("Selecionar e consultar previsão →")}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={styles.close}
            >
              <Text style={styles.body}>{t("Voltar")}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    backgroundColor: "#294c40",
    borderRadius: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    alignSelf: "center",
  },
  content: { padding: 22, gap: 14 },
  title: { color: "#fff1c7", fontSize: 22, fontWeight: "600" },
  body: { color: "#eef0df", fontSize: 14, lineHeight: 21 },
  input: {
    color: "#fff",
    borderWidth: 1,
    borderColor: "#8b9b70",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#f4d67d",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    minHeight: 48,
  },
  buttonText: { color: "#294c40", fontWeight: "600", fontSize: 15 },
  disabled: { opacity: 0.5 },
  result: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#81956f",
    gap: 6,
  },
  hint: { color: "#f4d67d", fontSize: 12 },
  sources: { flexDirection: "row", flexWrap: "wrap", columnGap: 12 },
  source: { minHeight: 44, justifyContent: "center" },
  close: { padding: 12, alignItems: "center", minHeight: 44 },
});
