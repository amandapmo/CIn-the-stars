import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  View,
  Text,
  StyleSheet,
} from "react-native";
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  Stop,
  G,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils/colors";
import { useLanguage } from "../../i18n/LanguageContext";
import type { CropCalendar, PlantingWindow } from "../../types/cropCalendar";
import { plantingClock } from "../../utils/plantingClock";

type Props = {
  crop: string;
  calendar: CropCalendar | null;
  window: PlantingWindow | null;
  loading: boolean;
  error: string | null;
  hasLocation: boolean;
  onSelectWindow: (id: string) => void;
  onRetry: () => void;
};

export default function CropClockWidget({
  crop,
  calendar,
  window,
  loading,
  error,
  hasLocation,
  onSelectWindow,
  onRetry,
}: Props) {
  const { locale, t } = useLanguage();
  const [linkError, setLinkError] = useState("");
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const geometry = window ? plantingClock(window) : null;
  const angles =
    geometry &&
    calendar?.available &&
    !loading &&
    !error &&
    Number.isFinite(geometry.startAngle) &&
    Number.isFinite(geometry.endAngle) &&
    Number.isFinite(geometry.sweep) &&
    geometry.sweep > 0
      ? geometry
      : null;
  const startRadians = angles ? ((angles.startAngle - 90) * Math.PI) / 180 : 0;
  const endRadians = angles ? ((angles.endAngle - 90) * Math.PI) / 180 : 0;
  const sector = angles
    ? `M ${cx} ${cy} L ${cx + radius * Math.cos(startRadians)} ${cy + radius * Math.sin(startRadians)} A ${radius} ${radius} 0 ${angles.sweep > 180 ? 1 : 0} 1 ${cx + radius * Math.cos(endRadians)} ${cy + radius * Math.sin(endRadians)} Z`
    : "";
  const month = (value: number) =>
    new Date(Date.UTC(2024, value - 1, 1)).toLocaleDateString(locale, {
      month: "long",
      timeZone: "UTC",
    });
  const startMonth = angles && window ? month(window.start_month) : "";
  const endMonth = angles && window ? month(window.end_month) : "";
  const updated = calendar?.last_updated;
  const updatedDate =
    updated && /^\d{4}-\d{2}-\d{2}/.test(updated) ? new Date(updated) : null;
  const sourceDate =
    updatedDate && Number.isFinite(updatedDate.getTime())
      ? updatedDate.toLocaleDateString(locale, { timeZone: "UTC" })
      : updated;
  const showOptions =
    !!calendar &&
    (calendar.windows.length > 1 ||
      calendar.reason === "region_selection_required");

  const seedPositions = [
    { x: cx - 55, y: cy - 40 },
    { x: cx - 25, y: cy - 70 },
    { x: cx - 75, y: cy + 10 },
    { x: cx - 45, y: cy + 50 },
    { x: cx - 15, y: cy + 75 },
    { x: cx - 20, y: cy + 25 },
    { x: cx + 15, y: cy + 65 },
    { x: cx + 55, y: cy + 45 },
    { x: cx + 45, y: cy + 80 },
    { x: cx - 65, y: cy - 10 },
    { x: cx - 40, y: cy - 20 },
    { x: cx + 5, y: cy + 45 },
    { x: cx + 75, y: cy + 15 },

    { x: cx + 25, y: cy - 25 },
    { x: cx + 50, y: cy - 15 },
    { x: cx + 70, y: cy - 45 },
    { x: cx + 35, y: cy - 65 },
    { x: cx + 55, y: cy - 55 },
    { x: cx + 80, y: cy - 25 },
    { x: cx + 15, y: cy - 50 },
    { x: cx + 40, y: cy - 40 },
    { x: cx + 60, y: cy - 75 },
    { x: cx + 25, y: cy - 80 },
  ];

  const renderPlant = (
    plant: { x: number; y: number; healthy: boolean },
    index: number,
  ) => {
    if (plant.healthy) {
      return (
        <G key={index} transform={`translate(${plant.x} ${plant.y})`}>
          <Path
            d="M 0 0 C 0 -4, 2 -7, 2 -11"
            stroke="#3E4C1F"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
          <Path d="M 1 -3 C -3 -6, -4 -1, 0 0 Z" fill="#3E4C1F" opacity="0.6" />
          <Path d="M 2 -7 C 7 -10, 8 -4, 2 -3 Z" fill="#3E4C1F" opacity="0.6" />
        </G>
      );
    }
    return (
      <G
        key={index}
        transform={`translate(${plant.x} ${plant.y}) rotate(${index % 2 === 0 ? 25 : -25})`}
      >
        <Path
          d="M -4 -1 C -4 -5 1 -6 4 -2 C 7 3 1 7 -2 4 C -3 2 -4 1 -4 -1 Z"
          fill="#6D4426"
          opacity={0.8}
        />
        <Path
          d="M -1 -3 Q 2 0 0 4"
          stroke="#CAA170"
          strokeWidth={0.9}
          fill="none"
        />
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>
        {angles
          ? `${t("mês inicial")}: ${startMonth}`
          : t("Calendário de plantio")}
      </Text>

      <View
        style={styles.clockWrapper}
        accessible
        accessibilityLabel={`${t("Calendário de plantio")}. ${t(crop)}.${angles ? ` ${t("mês inicial")}: ${startMonth}. ${t("mês final")}: ${endMonth}.` : ""}`}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="65%" stopColor="#E9C46A" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Circle cx={cx} cy={cy} r={radius + 15} fill="url(#glow)" />

          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={angles ? "#B9864F" : "#777C61"}
            opacity={0.9}
          />

          {angles &&
            (angles.sweep === 360 ? (
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={colors.indicatorVerde}
                opacity={0.9}
              />
            ) : (
              <Path d={sector} fill={colors.indicatorVerde} opacity={0.9} />
            ))}

          {seedPositions.map((plant, index) => {
            const angle =
              ((Math.atan2(plant.y - cy, plant.x - cx) * 180) / Math.PI + 450) %
              360;
            const relativeAngle = angles
              ? (angle - angles.startAngle + 360) % 360
              : 0;
            return renderPlant(
              { ...plant, healthy: !!angles && relativeAngle < angles.sweep },
              index,
            );
          })}

          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#E9C46A"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.9}
          />
          {angles && (
            <>
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={colors.indicatorVerde}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${(radius * 2 * Math.PI * angles.sweep) / 360} ${radius * 2 * Math.PI}`}
                strokeLinecap="round"
                transform={`rotate(${angles.startAngle - 90} ${cx} ${cy})`}
              />

              <G transform={`rotate(${angles.startAngle} ${cx} ${cy})`}>
                <Path
                  d={`M${cx - 3} ${cy} L${cx - 1} ${cy - 85} L${cx + 1} ${cy - 85} L${cx + 3} ${cy} Z`}
                  fill="#2C3A12"
                />
                <Path
                  d={`M${cx} ${cy - 85} Q${cx - 15} ${cy - 100} ${cx} ${cy - 110} Q${cx + 15} ${cy - 100} ${cx} ${cy - 85} Z`}
                  fill="#2C3A12"
                />
              </G>

              <G transform={`rotate(${angles.endAngle} ${cx} ${cy})`}>
                <Path
                  d={`M${cx - 3} ${cy} L${cx - 1} ${cy - 85} L${cx + 1} ${cy - 85} L${cx + 3} ${cy} Z`}
                  fill="#2C3A12"
                  opacity={0.8}
                />
                <Path
                  d={`M${cx} ${cy - 85} Q${cx - 15} ${cy - 100} ${cx} ${cy - 110} Q${cx + 15} ${cy - 100} ${cx} ${cy - 85} Z`}
                  fill="#2C3A12"
                  opacity={0.8}
                />
              </G>

              <Circle cx={cx} cy={cy} r={10} fill="#2C3A12" />
            </>
          )}
        </Svg>

        <View style={styles.bottomIcon}>
          <Ionicons name="leaf" size={26} color="#3E4C1F" />
        </View>
      </View>

      {angles && (
        <Text style={styles.monthLabelBottom}>
          {t("mês final")}: {endMonth}
        </Text>
      )}
      <View style={styles.details}>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            accessibilityLabel={t("Calendário de plantio")}
          />
        ) : error ? (
          <>
            <Text style={styles.caption} accessibilityRole="alert">
              {t(error)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.option}
            >
              <Text style={styles.optionText}>{t("Tentar novamente")}</Text>
            </Pressable>
          </>
        ) : (
          !angles && (
            <Text style={styles.caption}>
              {t(
                !hasLocation
                  ? "Escolha a localização para consultar o calendário."
                  : showOptions
                    ? "Selecione uma região"
                    : "Nenhum calendário disponível para esta cultura e região.",
              )}
            </Text>
          )
        )}
        {showOptions && (
          <View style={styles.options}>
            <Text style={styles.caption}>{t("Selecione uma região")}</Text>
            {calendar.windows.map((candidate) => (
              <Pressable
                key={candidate.id}
                accessibilityRole="button"
                accessibilityState={{ selected: candidate.id === window?.id }}
                aria-pressed={candidate.id === window?.id}
                onPress={() => onSelectWindow(candidate.id)}
                style={[
                  styles.option,
                  candidate.id === window?.id && styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  {candidate.region || calendar.region || calendar.country}
                  {candidate.season
                    ? ` · ${t("Safra")}: ${t(candidate.season)}`
                    : ""}
                  {` · ${month(candidate.start_month)} – ${month(candidate.end_month)}`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {angles && window && (
          <>
            {!!(window.region || calendar?.region || calendar?.country) && (
              <Text style={styles.caption}>
                {t("Região")}:{" "}
                {window.region || calendar?.region || calendar?.country}
              </Text>
            )}
            {!!window.season && (
              <Text style={styles.caption}>
                {t("Safra")}: {t(window.season)}
              </Text>
            )}
            {!!window.notes && (
              <Text style={styles.caption}>
                {t("Notas da fonte")}: {window.notes}
              </Text>
            )}
          </>
        )}
        {calendar && (
          <Pressable
            accessibilityRole="link"
            style={styles.source}
            onPress={() => {
              setLinkError("");
              void Linking.openURL("https://cropcalendar.apps.fao.org/").catch(
                () => setLinkError("Não foi possível abrir o link."),
              );
            }}
          >
            <Text style={styles.sourceText}>
              {t("Fonte")}: {calendar.source || "FAO Crop Calendar"}
              {sourceDate ? ` · ${sourceDate}` : ""}
            </Text>
          </Pressable>
        )}
        {!!linkError && (
          <Text accessibilityRole="alert" style={styles.caption}>
            {t(linkError)}
          </Text>
        )}
        {calendar && (
          <Text style={styles.caption}>
            {t(
              "Calendário regional da FAO; confirme as condições locais antes de plantar.",
            )}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 0 },
  monthLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    zIndex: 10,
    elevation: 5,
  },
  monthLabelBottom: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
    zIndex: 10,
  },
  clockWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomIcon: {
    position: "absolute",
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 30,
    bottom: -5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  details: { maxWidth: 420, width: "100%", gap: 9, marginTop: 18 },
  caption: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  options: { gap: 8, alignSelf: "stretch" },
  option: {
    padding: 10,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(233,196,106,0.45)",
    justifyContent: "center",
  },
  selectedOption: {
    backgroundColor: "rgba(167,201,87,0.2)",
    borderColor: colors.indicatorVerde,
  },
  optionText: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  source: { minHeight: 44, justifyContent: "center" },
  sourceText: {
    color: colors.primary,
    fontSize: 12,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
