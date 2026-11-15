import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, Text, View } from "react-native";

type Props = {
  scale: number;
  fontScale?: number;
  onHistoryPress?: () => void;
  onComparePress?: () => void;
  onAnalyzePress?: () => void;
};

type CardProps = {
  scale: number;
  fontScale: number;
  kind: "history" | "compare" | "analyze";
  onPress?: () => void;
};

const CARDS = {
  history: {
    title: "Aptidão\nde Solo",
    action: "Ver Histórico\nNASA",
    colors: ["#6b879d", "#6f866f", "#77812f"] as const,
    titleColor: "#e9e9e5",
  },
  compare: {
    title: "Rotações\nSugeridas",
    action: "Comparar",
    colors: ["#7c8e0a", "#829504", "#a1b00b"] as const,
    titleColor: "#e5dc8b",
  },
  analyze: {
    title: "Risco\nClimático",
    action: "Analisar",
    colors: ["#c99c08", "#ee9810", "#ff9602"] as const,
    titleColor: "#ffd49c",
  },
};

export function getActionCardsHeight(scale: number, fontScale = 1) {
  const heightDesign = Math.max(
    326,
    105 +
      36 * (fontScale - 1) +
      100 * fontScale +
      21 +
      Math.max(74, 60 * fontScale) +
      26,
  );
  return heightDesign * scale;
}

function Card({ scale, fontScale, kind, onPress }: CardProps) {
  const card = CARDS[kind];
  const isHistory = kind === "history";
  const cardWidth = 276 * scale * fontScale;

  return (
    <LinearGradient
      colors={card.colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{
        width: cardWidth,
        height: getActionCardsHeight(scale, fontScale),
        borderRadius: 45 * scale,
        overflow: "hidden",
        borderWidth: kind === "compare" ? 3 * scale : 0,
        borderColor: "#e1dda8",
      }}
    >
      {isHistory && (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            position: "absolute",
            top: 62 * scale,
            left: 16 * scale,
            right: 16 * scale,
            color: "#f0f0ed",
            fontSize: 29 * scale,
            lineHeight: 36 * scale,
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          Precipitação / Solo
        </Text>
      )}
      <Text
        style={{
          position: "absolute",
          top: ((isHistory ? 105 : 84) + (fontScale - 1) * 36) * scale,
          left: 10 * scale,
          right: 10 * scale,
          color: card.titleColor,
          fontSize: 44 * scale,
          lineHeight: 50 * scale,
          fontWeight: "700",
          textAlign: "center",
          includeFontPadding: false,
        }}
      >
        {card.title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={card.action.replace("\n", " ")}
        accessibilityState={{ disabled: !onPress }}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => ({
          position: "absolute",
          left: 29 * scale,
          bottom: 26 * scale,
          width: cardWidth - 58 * scale,
          height: Math.max(74, 60 * fontScale) * scale,
          borderRadius: 40 * scale,
          backgroundColor: isHistory ? "#ffdfa0" : "rgba(79, 111, 0, 0.69)",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            color: isHistory ? "#063da2" : "#e1c35e",
            fontSize: 29 * scale,
            lineHeight: 30 * scale,
            fontWeight: isHistory ? "400" : "700",
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          {card.action}
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

export default function ActionCards({
  scale,
  fontScale = 1,
  onHistoryPress,
  onComparePress,
  onAnalyzePress,
}: Props) {
  const height = getActionCardsHeight(scale, fontScale);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width: 937 * scale, height }}
      contentContainerStyle={{ paddingLeft: 32 * scale, gap: 18 * scale }}
    >
      <Card
        scale={scale}
        fontScale={fontScale}
        kind="history"
        onPress={onHistoryPress}
      />
      <Card
        scale={scale}
        fontScale={fontScale}
        kind="compare"
        onPress={onComparePress}
      />
      <Card
        scale={scale}
        fontScale={fontScale}
        kind="analyze"
        onPress={onAnalyzePress}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: 28 * scale, height, overflow: "hidden" }}
      >
        <LinearGradient
          colors={["#d63284", "#e17972", "#e5b17c"]}
          style={{
            width: 276 * scale * fontScale,
            height,
            borderRadius: 45 * scale,
          }}
        />
      </View>
    </ScrollView>
  );
}
