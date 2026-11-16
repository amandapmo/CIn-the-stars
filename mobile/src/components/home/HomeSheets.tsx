import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";
import { colors } from "../../utils/colors";
import type { RecommendationResponse } from "../../api/recommendation";

export type HomePanel =
  "settings" | "terms" | "logout" | "soil" | "risk" | null;

type Props = {
  panel: HomePanel;
  onClose: () => void;
  onLogout: () => void;
  onAnalyze: () => void;
  onChooseLocation: () => void;
  hasLocation: boolean;
  location: string;
  crop: string;
  loading: boolean;
  analysis: RecommendationResponse | null;
  error: string | null;
};

export default function HomeSheets(props: Props) {
  const { t, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [linkError, setLinkError] = useState(false);
  const titles = {
    settings: "Configurações",
    terms: "Termos e condições",
    logout: "Encerrar sessão local?",
    soil: "Aptidão do solo",
    risk: "Risco climático",
  };
  function openSource(url: string) {
    setLinkError(false);
    void Linking.openURL(url).catch(() => setLinkError(true));
  }
  return (
    <Modal
      visible={props.panel !== null}
      animationType="slide"
      transparent
      onRequestClose={props.onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Fechar")}
          style={StyleSheet.absoluteFill}
          onPress={props.onClose}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {props.panel ? t(titles[props.panel]) : ""}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Voltar")}
              onPress={props.onClose}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textLight} />
              <Text style={styles.text}>{t("Voltar")}</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {props.panel === "settings" && (
              <>
                <Text style={styles.title}>{t("Idioma")}</Text>
                {(["pt-BR", "en"] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: language === value }}
                    aria-pressed={language === value}
                    onPress={() => setLanguage(value)}
                    style={[
                      styles.button,
                      language === value && styles.selected,
                    ]}
                  >
                    <Text style={styles.text}>
                      {t(value === "pt-BR" ? "Português (Brasil)" : "Inglês")}
                      {language === value ? " ✓" : ""}
                    </Text>
                  </Pressable>
                ))}
                <Text style={styles.title}>{t("Localização e clima")}</Text>
                <Text style={styles.text}>
                  {t(
                    "Escolha um município ou solicite a localização aproximada na Home. O aplicativo não acompanha seu deslocamento.",
                  )}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={props.onChooseLocation}
                  style={styles.button}
                >
                  <Text style={styles.text}>{t("Escolher município")}</Text>
                </Pressable>
              </>
            )}
            {props.panel === "terms" && (
              <>
                <Text style={styles.title}>{t("Uso do protótipo")}</Text>
                <Text style={styles.text}>
                  {t(
                    "O aplicativo oferece apoio informativo. Calendários regionais, previsões e hipóteses visuais não substituem avaliação agronômica local.",
                  )}
                </Text>
                <Text style={styles.title}>{t("Dados e privacidade")}</Text>
                <Text style={styles.text}>
                  {t(
                    "A localização é opcional. A consulta usa coordenadas aproximadas e serviços externos podem registrar consultas e IP. Fotos são enviadas ao servidor para análise quando você solicitar.",
                  )}
                </Text>
                <Text style={styles.text}>
                  {t(
                    "O calendário usa o país e a região. Quando essas informações faltarem, o servidor consulta a localização aproximada no Nominatim/OpenStreetMap e mantém o resultado por até uma hora. A FAO recebe apenas o país consultado.",
                  )}
                </Text>
                <Text style={styles.text}>
                  {t(
                    "Este texto descreve o funcionamento do protótipo e ainda precisa de revisão pela equipe antes de uma publicação comercial.",
                  )}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  style={styles.button}
                  onPress={() =>
                    openSource("https://open-meteo.com/en/terms#privacy")
                  }
                >
                  <Text style={styles.text}>Open-Meteo</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  style={styles.button}
                  onPress={() =>
                    openSource("https://cropcalendar.apps.fao.org/")
                  }
                >
                  <Text style={styles.text}>FAO Crop Calendar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  style={styles.button}
                  onPress={() =>
                    openSource(
                      "https://operations.osmfoundation.org/policies/nominatim/",
                    )
                  }
                >
                  <Text style={styles.text}>OpenStreetMap / Nominatim</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  style={styles.button}
                  onPress={() =>
                    openSource("https://www.openstreetmap.org/copyright")
                  }
                >
                  <Text style={styles.text}>
                    © OpenStreetMap contributors · ODbL
                  </Text>
                </Pressable>
              </>
            )}
            {props.panel === "logout" && (
              <>
                <Text style={styles.text}>
                  {t(
                    "A conversa e a localização selecionada serão encerradas. Seus registros salvos no perfil serão mantidos. Este protótipo não possui autenticação de conta.",
                  )}
                </Text>
                <Text style={styles.text}>
                  {t(
                    "O encerramento remove o acesso local à conversa. O histórico pode permanecer na memória do servidor até ele ser reiniciado.",
                  )}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={props.onLogout}
                  style={styles.button}
                >
                  <Text style={styles.text}>{t("Confirmar")}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={props.onClose}
                  style={styles.button}
                >
                  <Text style={styles.text}>{t("Cancelar")}</Text>
                </Pressable>
              </>
            )}
            {(props.panel === "soil" || props.panel === "risk") && (
              <>
                <Text style={styles.text}>
                  {props.location} · {t(props.crop)}
                </Text>
                {props.panel === "soil" ? (
                  <>
                    <Text style={styles.title}>
                      {t("Aptidão não avaliada")}
                    </Text>
                    <Text style={styles.text}>
                      {t(
                        "Histórico climático e análise do solo são informações diferentes. É necessária análise local para avaliar o solo da propriedade.",
                      )}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.text}>
                    {t("Sem classificação de risco disponível.")}
                  </Text>
                )}
                {props.analysis?.recommendation_status ? (
                  <Text style={styles.text}>
                    {t("Status")}:{" "}
                    {t(
                      props.analysis.recommendation_status === "success"
                        ? "Dados recebidos"
                        : "Avaliação com limitações",
                    )}
                  </Text>
                ) : (
                  <Text style={styles.text}>
                    {t(
                      "A API agrícola ainda não retornou dados. Previsão do tempo não mede a aptidão do solo.",
                    )}
                  </Text>
                )}
                {!!props.analysis?.message && (
                  <Text style={styles.text}>{t(props.analysis.message)}</Text>
                )}
                {!!props.analysis?.error && (
                  <Text accessibilityRole="alert" style={styles.text}>
                    {t(props.analysis.error)}
                  </Text>
                )}
                {!!props.error && (
                  <Text accessibilityRole="alert" style={styles.text}>
                    {t(props.error)}
                  </Text>
                )}
                {props.loading ? (
                  <ActivityIndicator
                    accessibilityLabel={t("Carregando…")}
                    color={colors.primary}
                  />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={
                      props.hasLocation
                        ? props.onAnalyze
                        : props.onChooseLocation
                    }
                    style={styles.button}
                  >
                    <Text style={styles.text}>
                      {t(
                        props.hasLocation
                          ? "Consultar análise agrícola"
                          : "Escolher município",
                      )}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="link"
                  onPress={() => openSource("https://power.larc.nasa.gov/")}
                  style={styles.button}
                >
                  <Text style={styles.text}>{t("Ver fonte NASA POWER")}</Text>
                </Pressable>
              </>
            )}
            {linkError && (
              <Text accessibilityRole="alert" style={styles.text}>
                {t("Não foi possível abrir o link.")}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  title: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  content: { gap: 16, paddingBottom: 12 },
  text: { color: colors.textLight, fontSize: 15, lineHeight: 23 },
  button: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selected: { borderColor: colors.primary },
});
