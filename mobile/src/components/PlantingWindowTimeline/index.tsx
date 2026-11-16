import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../utils/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";

const TIMELINE_STEPS = [
  { id: "1", weekday: 2, icon: "check", color: colors.textLight, size: 16 },
  {
    id: "2",
    weekday: 3,
    icon: "seed-outline",
    color: colors.indicatorVerde,
    size: 16,
  },
  { id: "3", weekday: 4, icon: "seed", color: colors.indicatorVerde, size: 18 },
  {
    id: "4",
    weekday: 5,
    icon: "sprout",
    color: colors.indicatorVerde,
    size: 22,
  },
  { id: "5", weekday: 6, icon: "leaf", color: colors.indicatorVerde, size: 24 },
  { id: "6", weekday: 0, icon: "tree", color: colors.indicatorVerde, size: 26 },
  {
    id: "7",
    weekday: 1,
    icon: "star",
    color: "rgba(255,255,255,0.4)",
    size: 16,
  },
];

export default function PlantingWindowTimeline() {
  const { locale, t } = useLanguage();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Janela de Plantio")}</Text>

      <View style={styles.timelineContainer}>
        <View style={styles.backgroundLine} />

        <View style={styles.stepsRow}>
          {TIMELINE_STEPS.map((step) => (
            <View key={step.id} style={styles.stepWrapper}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={step.icon as any}
                  size={step.size}
                  color={step.color}
                />
              </View>
              <Text style={styles.dayText}>
                {new Date(
                  Date.UTC(2026, 0, 4 + step.weekday),
                ).toLocaleDateString(locale, {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.9,
  },
  timelineContainer: { position: "relative", justifyContent: "center" },
  backgroundLine: {
    position: "absolute",
    top: 14,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepWrapper: { alignItems: "center", gap: 8 },
  iconContainer: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 2,
  },
  dayText: { color: "rgba(255, 255, 255, 0.6)", fontSize: 12 },
});
