import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLanguage } from "../../i18n/LanguageContext";
import { colors } from "../../utils/colors";

interface ActionCardsProps {
  onAnalyzePress: () => void;
  onSoilPress: () => void;
  onRotationsPress: () => void;
  isLoading: boolean;
}

export default function ActionCards({
  onAnalyzePress,
  onSoilPress,
  onRotationsPress,
  isLoading,
}: ActionCardsProps) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("Aptidão do solo")}
        onPress={onSoilPress}
        style={[styles.card, styles.cardSolo]}
      >
        <Text style={styles.cardSubtitle}>{t("Precipitação / Solo")}</Text>
        <Text style={styles.cardTitle}>{t("Aptidão do solo")}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{t("Ver Histórico NASA")}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("Rotações sugeridas")}
        onPress={onRotationsPress}
        style={[styles.card, styles.cardRotacoes]}
      >
        <Text style={styles.cardTitleCentered}>{t("Rotações sugeridas")}</Text>
        <View style={[styles.pill, styles.pillDark]}>
          <Text style={styles.pillTextDark}>{t("Comparar")}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.cardRisco]}
        accessibilityRole="button"
        accessibilityLabel={t("Risco climático")}
        onPress={onAnalyzePress}
        disabled={isLoading}
      >
        <Text style={[styles.cardTitleCentered, { color: colors.textDark }]}>
          {t("Risco climático")}
        </Text>
        <View
          style={[
            styles.pill,
            styles.pillDark,
            { backgroundColor: "rgba(0,0,0,0.1)" },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textDark} />
          ) : (
            <Text style={[styles.pillTextDark, { color: colors.textDark }]}>
              {t("Analisar")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 24,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 140,
    justifyContent: "space-between",
  },
  cardSolo: { backgroundColor: colors.surface },
  cardRotacoes: { backgroundColor: colors.secondary },
  cardRisco: { backgroundColor: colors.primary },
  cardTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  cardSubtitle: { color: colors.textLight, fontSize: 10, opacity: 0.8 },
  cardTitleCentered: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  pill: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  pillDark: { backgroundColor: "rgba(0,0,0,0.2)" },
  pillText: { color: colors.textDark, fontSize: 10, fontWeight: "bold" },
  pillTextDark: { color: colors.textLight, fontSize: 12, fontWeight: "600" },
});
