import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

type Props = { scale: number };

const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const CENTERS = [78, 194, 309, 424, 538, 653, 787];
const CONNECTORS = [
  [116, 155],
  [234, 274],
  [354, 394],
  [472, 512],
  [589, 629],
  [711, 751],
];

function Plant({ x, stage }: { x: number; stage: number }) {
  return (
    <G transform={`translate(${x} 0)`}>
      {stage > 1 && <Path d="M-22 52Q-4 30 20 52Z" fill="#b0a13d" />}
      <Path
        d={stage > 1 ? "M0 45V17Q1 10 7 7" : "M0 48V22Q0 14 7 10"}
        stroke="#a7b54b"
        strokeWidth={3}
        fill="none"
      />
      <Path d="M1 27C-16 29-24 19-24 8-10 6 2 12 1 27Z" fill="#a8b823" />
      <Path d="M2 20C0 5 10-2 23-3 23 10 17 18 2 20Z" fill="#acc017" />
      {stage > 1 && (
        <Path d="M0 37C4 23 15 21 24 25 20 36 12 41 0 37Z" fill="#9eb318" />
      )}
      {stage > 2 && (
        <Path d="M0 12C-12 14-17 8-16 0-6-1 0 3 0 12Z" fill="#a3b830" />
      )}
      {stage > 3 && (
        <Path d="M8 1C10-7 19-9 25-4 20 2 15 4 8 1Z" fill="#9cb620" />
      )}
    </G>
  );
}

export default function PlantingTimeline({ scale }: Props) {
  return (
    <LinearGradient
      colors={["rgba(116, 139, 124, 0.10)", "rgba(102, 135, 181, 0.20)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 877 * scale,
        height: 195 * scale,
        borderRadius: 54 * scale,
      }}
      accessible
      accessibilityLabel="Janela de Plantio. Sequência ilustrativa do protótipo, de terça a segunda-feira."
    >
      <Text
        maxFontSizeMultiplier={1.5}
        style={{
          position: "absolute",
          top: 0,
          width: "100%",
          color: "#f0f1ed",
          fontSize: 30 * scale,
          lineHeight: 36 * scale,
          textAlign: "center",
          fontWeight: "400",
          includeFontPadding: false,
        }}
      >
        Janela de Plantio
      </Text>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", top: 55 * scale }}
      >
        <Svg width={877 * scale} height={58 * scale} viewBox="0 0 877 58">
          {CONNECTORS.map(([left, right]) => (
            <Path
              key={left}
              d={`M${left} 27H${right}`}
              stroke="#a9b5ac"
              strokeOpacity={0.5}
              strokeWidth={4.5}
            />
          ))}
          <Path
            d="M65 25l10 9 17-19"
            fill="none"
            stroke="#f4f5e8"
            strokeWidth={4}
          />
          {[0, 1, 2, 3, 4].map((stage) => (
            <Plant key={stage} x={CENTERS[stage + 1]} stage={stage} />
          ))}
          <Path
            d="m787 6 6 13 15 2c3 0 4 3 1 5l-11 10 3 15c1 3-2 4-4 3l-13-8-13 8c-2 1-4-1-3-4l4-14-11-10c-2-2-1-5 2-5l15-2 6-13c1-3 3-3 4 0Z"
            fill="#8297b3"
            fillOpacity={0.8}
          />
        </Svg>
      </View>
      {DAYS.map((day, index) => (
        <Text
          key={day}
          maxFontSizeMultiplier={1.5}
          numberOfLines={1}
          style={{
            position: "absolute",
            left: (CENTERS[index] - 43) * scale,
            top: 132 * scale,
            width: 86 * scale,
            color: "#b5b9b4",
            fontSize: 28 * scale,
            lineHeight: 34 * scale,
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          {day}
        </Text>
      ))}
    </LinearGradient>
  );
}
