import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";

interface TopBarProps {
  location: string;
  cropType: string;
  onLocationPress: () => void;
  onCropPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onTermsPress: () => void;
  onLogoutPress: () => void;
}

export default function TopBar(props: TopBarProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Configurações", action: props.onSettingsPress },
    { label: "Termos e condições", action: props.onTermsPress },
    { label: "Sair", action: props.onLogoutPress },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("Meu perfil")}
          onPress={props.onProfilePress}
          style={styles.avatar}
        >
          <Ionicons name="person-outline" size={24} color={colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${t("Escolher município")}. ${props.location}`}
          onPress={props.onLocationPress}
          style={styles.chip}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textLight}
          />
          <Text numberOfLines={1} style={styles.chipText}>
            {props.location}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("Escolher cultura")}
          onPress={props.onCropPress}
          style={styles.chip}
        >
          <Ionicons name="leaf-outline" size={16} color={colors.textLight} />
          <Text numberOfLines={1} style={styles.chipText}>
            {t(props.cropType)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("Abrir opções")}
          accessibilityState={{ expanded: open }}
          aria-expanded={open}
          onPress={() => setOpen(true)}
          style={{ padding: 6 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Fechar")}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={{
              position: "absolute",
              top: insets.top + 60,
              right: 16,
              minWidth: 210,
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.label}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  option.action();
                }}
                style={{ padding: 14 }}
              >
                <Text style={styles.chipText}>{t(option.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexShrink: 1,
  },
  chipText: {
    color: colors.textLight,
    fontSize: 14,
    flexShrink: 1,
  },
});
