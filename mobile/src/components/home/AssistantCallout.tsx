import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type AssistantCalloutProps = {
  scale: number;
  onPress?: () => void;
};

export default function AssistantCallout({
  scale,
  onPress,
}: AssistantCalloutProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Como posso te ajudar hoje?"
      disabled={!onPress}
      onPress={onPress}
      style={{ width: 502 * scale, height: 138 * scale }}
    >
      <View
        style={[
          styles.pill,
          {
            left: 65 * scale,
            top: 12 * scale,
            width: 437 * scale,
            height: 112 * scale,
            borderRadius: 56 * scale,
            borderWidth: 3 * scale,
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            width: 136 * scale,
            height: 136 * scale,
            borderRadius: 68 * scale,
            borderWidth: 3 * scale,
          },
        ]}
      >
        <Svg
          width={112 * scale}
          height={112 * scale}
          viewBox="0 0 112 112"
          style={{ position: "absolute", left: 9 * scale, top: 9 * scale }}
        >
          <Path
            d="M22 66a34 34 0 0 1 68 0M56 12v12M28 20l6 10M8 42l11 5M84 20l-6 10M104 42l-11 5M56 99V75M56 83C44 83 37 78 36 67c13 0 19 4 20 16ZM56 80c2-12 8-16 21-17-1 12-8 18-21 17ZM38 103q18-18 36 0"
            fill="none"
            stroke="#e9d08e"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text
        maxFontSizeMultiplier={1.2}
        numberOfLines={2}
        adjustsFontSizeToFit
        style={[
          styles.text,
          {
            left: 150 * scale,
            top: 20 * scale,
            width: 330 * scale,
            height: 92 * scale,
            fontSize: 43 * scale,
            lineHeight: 46 * scale,
          },
        ]}
      >
        {"Como posso te\najudar hoje?"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    backgroundColor: "rgba(24, 68, 86, 0.55)",
    borderColor: "#b1c0c6a0",
  },
  circle: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "rgba(40, 79, 101, 0.78)",
    borderColor: "#b1c0c6a0",
  },
  text: {
    position: "absolute",
    color: "#efdda9",
    fontWeight: "700",
    includeFontPadding: false,
  },
});
