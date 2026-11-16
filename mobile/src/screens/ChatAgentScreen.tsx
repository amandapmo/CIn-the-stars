import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  sendChatMessage,
  type ChatResponse,
  type ChatSession,
} from "../api/chat";
import { useLanguage } from "../i18n/LanguageContext";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: { title: string; url: string }[];
  isPhotoNotice?: boolean;
  vision?: ChatResponse["vision"];
}

const diagnosisLabels: Record<string, string> = {
  early_blight: "Pinta-preta",
  late_blight: "Requeima",
  bacterial_spot_solanaceae: "Mancha bacteriana de solanáceas",
  healthy: "Sem doença aparente na classificação visual",
};

function responseError(result: ChatResponse): string | null {
  return result.vision?.status === "error" ||
    result.vision?.status === "unavailable" ||
    (result.api_status && result.api_status !== "ok")
    ? result.response
    : null;
}

export default function ChatAgentScreen({ navigation, route }: any) {
  const { language, setLanguage, locale, t } = useLanguage();
  const initialResponse = route?.params?.initialResponse as
    ChatResponse | undefined;
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialResponse
      ? [
          {
            role: "user",
            text: "Fotografia de uma folha.",
            isPhotoNotice: true,
          },
          {
            role: "assistant",
            text: initialResponse.response,
            sources: initialResponse.sources,
            vision: initialResponse.vision,
          },
        ]
      : [],
  );
  const [text, setText] = useState("");
  const [crop, setCrop] = useState("");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [session, setSession] = useState<ChatSession | null>(() =>
    initialResponse
      ? {
          thread_id: initialResponse.thread_id,
          session_token: initialResponse.session_token,
        }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    initialResponse ? responseError(initialResponse) : null,
  );
  const [retryAt, setRetryAt] = useState(() =>
    initialResponse?.retry_after
      ? Date.now() + initialResponse.retry_after * 1000
      : 0,
  );
  const sending = useRef(false);
  const seededThread = useRef(initialResponse?.thread_id);
  const conversationGeneration = useRef(0);
  const scrollView = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (
      !initialResponse ||
      initialResponse.thread_id === seededThread.current
    ) {
      return;
    }
    seededThread.current = initialResponse.thread_id;
    conversationGeneration.current += 1;
    sending.current = false;
    setMessages([
      { role: "user", text: "Fotografia de uma folha.", isPhotoNotice: true },
      {
        role: "assistant",
        text: initialResponse.response,
        sources: initialResponse.sources,
        vision: initialResponse.vision,
      },
    ]);
    setSession({
      thread_id: initialResponse.thread_id,
      session_token: initialResponse.session_token,
    });
    setRetryAt(
      initialResponse.retry_after
        ? Date.now() + initialResponse.retry_after * 1000
        : 0,
    );
    setText("");
    setCrop("");
    setPhoto(null);
    setLoading(false);
    setError(responseError(initialResponse));
  }, [initialResponse]);

  async function selectPhoto() {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (!result.canceled) {
        if (!result.assets[0].base64) {
          setError(
            "Não foi possível ler a foto. Escolha uma imagem JPEG ou PNG.",
          );
          return;
        }
        setPhoto(result.assets[0]);
      }
    } catch {
      setError("Não foi possível abrir a galeria.");
    }
  }

  async function sendMessage() {
    if (sending.current || (!text.trim() && !photo)) return;
    if (Date.now() < retryAt) {
      setError(
        "O limite temporário do assistente ainda está ativo. Sua conversa foi preservada.",
      );
      return;
    }
    const generation = conversationGeneration.current;
    sending.current = true;
    setError(null);
    setLoading(true);
    try {
      const result = await sendChatMessage(
        text.trim(),
        crop.trim(),
        photo?.base64 || null,
        session,
      );
      if (generation !== conversationGeneration.current) return;
      setSession({
        thread_id: result.thread_id,
        session_token: result.session_token,
      });
      setRetryAt(
        result.retry_after ? Date.now() + result.retry_after * 1000 : 0,
      );
      setMessages((previous) => [
        ...previous,
        {
          role: "user",
          text: text.trim() || "Fotografia de uma folha.",
          isPhotoNotice: !text.trim(),
        },
        {
          role: "assistant",
          text: result.response,
          sources: result.sources,
          vision: result.vision,
        },
      ]);
      setText("");
      setPhoto(null);
      setError(responseError(result));
    } catch (error) {
      if (generation !== conversationGeneration.current) return;
      setError(
        error instanceof Error ? error.message : "Não foi possível enviar.",
      );
    } finally {
      if (generation === conversationGeneration.current) {
        sending.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("Voltar")}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, styles.screenTitle]}>
          {t("Assistente Agronómico")}
        </Text>
        <View style={styles.languages} accessibilityLabel={t("Idioma")}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("Português (Brasil)")}
            accessibilityState={
              Platform.OS === "web"
                ? undefined
                : { selected: language === "pt-BR" }
            }
            aria-pressed={language === "pt-BR"}
            onPress={() => setLanguage("pt-BR")}
            style={[
              styles.language,
              language === "pt-BR" && styles.selectedLanguage,
            ]}
          >
            <Text style={styles.languageText}>PT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("Inglês")}
            accessibilityState={
              Platform.OS === "web"
                ? undefined
                : { selected: language === "en" }
            }
            aria-pressed={language === "en"}
            onPress={() => setLanguage("en")}
            style={[
              styles.language,
              language === "en" && styles.selectedLanguage,
            ]}
          >
            <Text style={styles.languageText}>EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!error && (
        <View style={styles.feedback}>
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.feedbackText}
          >
            {t(error)}
          </Text>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollView}
          style={{ flex: 1 }}
          contentContainerStyle={
            messages.length ? styles.messages : styles.chatArea
          }
          onContentSizeChange={() =>
            scrollView.current?.scrollToEnd({ animated: true })
          }
        >
          {!messages.length && (
            <>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.textLight}
                style={{ opacity: 0.5, marginBottom: 16 }}
              />
              <Text style={styles.placeholderText}>
                {t(
                  "Envie uma folha bem enquadrada, com fundo neutro. As respostas são suspeitas, não diagnósticos.",
                )}
              </Text>
            </>
          )}
          {messages.map((message, index) => (
            <View key={index} style={styles.message}>
              <Text style={styles.headerTitle}>
                {t(message.role === "user" ? "Você" : "Assistente")}
              </Text>
              {message.vision?.status === "analyzed" && (
                <View style={styles.vision}>
                  <Text style={styles.visionLabel}>
                    {t("Suspeita visual (não é diagnóstico)")}
                  </Text>
                  <Text selectable style={styles.messageText}>
                    {t(
                      diagnosisLabels[message.vision.suspected_disease ?? ""] ??
                        message.vision.suspected_disease ??
                        "Classe indisponível",
                    )}
                  </Text>
                  {typeof message.vision.confidence === "number" &&
                    Number.isFinite(message.vision.confidence) &&
                    message.vision.confidence >= 0 &&
                    message.vision.confidence <= 1 && (
                      <Text style={styles.feedbackText}>
                        {t("Confiança do classificador")}:{" "}
                        {new Intl.NumberFormat(locale, {
                          style: "percent",
                          maximumFractionDigits: 1,
                        }).format(message.vision.confidence)}
                      </Text>
                    )}
                </View>
              )}
              {(message.vision?.status === "error" ||
                message.vision?.status === "unavailable") && (
                <Text style={styles.visionLabel}>
                  {t("Análise visual indisponível")}
                </Text>
              )}
              <Text selectable style={styles.messageText}>
                {message.isPhotoNotice || message.role === "assistant"
                  ? t(message.text)
                  : message.text}
              </Text>
              {message.sources?.map((source) => (
                <TouchableOpacity
                  key={source.url}
                  accessibilityRole="link"
                  onPress={() => {
                    if (/^https?:\/\//i.test(source.url)) {
                      setError(null);
                      void Linking.openURL(source.url).catch(() =>
                        setError("Não foi possível abrir o link."),
                      );
                    } else {
                      setError("Não foi possível abrir o link.");
                    }
                  }}
                >
                  <Text style={styles.source}>{source.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {loading && (
            <ActivityIndicator
              accessibilityLabel={t("Aguarde…")}
              color={colors.textLight}
            />
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={crop}
            onChangeText={setCrop}
            maxLength={100}
            accessibilityLabel={t("Cultura, se souber (ex.: batata)")}
            editable={!loading}
            placeholder={t("Cultura, se souber (ex.: batata)")}
            placeholderTextColor="#aaa"
          />
          {photo && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("Remover fotografia")}
              disabled={loading}
              onPress={() => setPhoto(null)}
            >
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel={t("Fotografia selecionada")}
                style={styles.preview}
              />
              <Text style={styles.placeholderText}>
                {t("Remover fotografia")}
              </Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={3000}
            accessibilityLabel={t("Descreva o que observou…")}
            editable={!loading}
            placeholder={t("Descreva o que observou…")}
            placeholderTextColor="#aaa"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void selectPhoto()}
              accessibilityLabel={t("Selecionar fotografia")}
            >
              <Ionicons
                name="image-outline"
                size={28}
                color={colors.textLight}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("Enviar")}
              disabled={loading || (!text.trim() && !photo)}
              onPress={() => void sendMessage()}
            >
              <Text style={styles.headerTitle}>
                {t(loading ? "Aguarde…" : "Enviar")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: { padding: 4 },
  headerTitle: { color: colors.textLight, fontSize: 18, fontWeight: "bold" },
  screenTitle: { flexShrink: 1, marginHorizontal: 8 },
  languages: { flexDirection: "row", gap: 4 },
  language: {
    minHeight: 36,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  selectedLanguage: { borderBottomColor: colors.primary },
  languageText: { color: colors.textLight, fontSize: 12, fontWeight: "600" },
  chatArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  inputArea: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  placeholderText: {
    color: colors.textLight,
    opacity: 0.7,
    textAlign: "center",
  },
  feedback: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  feedbackText: { color: colors.textLight, fontSize: 14, lineHeight: 21 },
  vision: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginVertical: 8,
  },
  visionLabel: { color: colors.textLight, fontSize: 14, fontWeight: "600" },
  messages: { padding: 16 },
  message: { marginBottom: 16 },
  messageText: { color: colors.textLight, lineHeight: 22, marginVertical: 8 },
  source: {
    color: colors.textLight,
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  input: { color: colors.textLight, paddingVertical: 10, maxHeight: 100 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  preview: { width: 64, height: 64, alignSelf: "center" },
});
