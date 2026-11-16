import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useState, useRef } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useLanguage } from "../i18n/LanguageContext";
import { sendChatMessage } from "../api/chat";

export default function CameraScreen({ navigation }: any) {
  const { t } = useLanguage();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const active = useRef(false);
  const capturing = useRef(false);
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const invalidateCapture = useCallback(() => {
    active.current = false;
    generation.current += 1;
    capturing.current = false;
    request.current?.abort();
    request.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setIsLoading(false);
      return invalidateCapture;
    }, [invalidateCapture]),
  );

  async function requestAccess() {
    setError(null);
    try {
      const result = await requestPermission();
      if (active.current && !result.granted)
        setError(
          "O acesso à câmera não foi autorizado. Você pode voltar sem conceder a permissão.",
        );
    } catch {
      if (active.current)
        setError("Não foi possível solicitar acesso à câmera.");
    }
  }

  const tirarFoto = async () => {
    if (capturing.current || !active.current) return;
    if (!cameraRef.current) {
      setError("A câmera ainda não está pronta. Tente novamente.");
      return;
    }
    capturing.current = true;
    const current = ++generation.current;
    const controller = new AbortController();
    request.current = controller;
    setError(null);
    setIsLoading(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({ base64: true });
      if (!active.current || current !== generation.current) return;
      if (!foto.base64)
        throw new Error("Não foi possível converter a foto para envio.");
      const result = await sendChatMessage(
        "",
        "",
        foto.base64,
        null,
        controller.signal,
      );
      if (active.current && current === generation.current)
        navigation.navigate("ChatAgent", { initialResponse: result });
    } catch (failure) {
      if (active.current && current === generation.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Falha ao enviar a foto para análise.",
        );
    } finally {
      if (current === generation.current) {
        capturing.current = false;
        request.current = null;
        if (active.current) setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("Voltar")}
          onPress={() => {
            invalidateCapture();
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          <Text style={styles.backText}>{t("Voltar")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Diagnóstico da folha")}</Text>
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
      {!permission ? (
        <View style={styles.permissionContainer}>
          <ActivityIndicator color={colors.textLight} />
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {t("Carregando permissões da câmera…")}
          </Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.text}>
            {t("Precisamos da sua permissão para usar a câmera.")}
          </Text>
          <Button
            onPress={() => void requestAccess()}
            title={t("Conceder Permissão")}
          />
        </View>
      ) : isFocused ? (
        <View style={styles.camera}>
          <CameraView
            style={StyleSheet.absoluteFill}
            ref={cameraRef}
            onMountError={() => {
              if (active.current)
                setError(
                  "Não foi possível iniciar a câmera. Volte e tente novamente.",
                );
            }}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("Capturar folha")}
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={tirarFoto}
              disabled={isLoading}
            >
              <Text style={styles.text}>
                {isLoading
                  ? t("Enviando foto...")
                  : `📸 ${t("Capturar folha")}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  backText: { color: colors.textLight, fontSize: 14 },
  headerTitle: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  feedback: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  feedbackText: { color: colors.textLight, fontSize: 14, lineHeight: 21 },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#000000a0",
    padding: 15,
    borderRadius: 10,
  },
  disabledButton: { opacity: 0.6 },
  text: { fontSize: 18, fontWeight: "bold", color: "white" },
});
