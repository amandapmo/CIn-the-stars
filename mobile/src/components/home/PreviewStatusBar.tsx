import { Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

export default function PreviewStatusBar({ scale }: { scale: number }) {
  return (
    <View style={{ height: 90 * scale, width: 937 * scale }}>
      <Text
        style={{
          position: "absolute",
          left: 114 * scale,
          top: 27 * scale,
          color: "#FFFFFF",
          fontSize: 40 * scale,
          lineHeight: 50 * scale,
          fontWeight: "600",
        }}
      >
        9:41
      </Text>
      <View
        style={{
          position: "absolute",
          left: 670 * scale,
          top: 35 * scale,
          width: 190 * scale,
          height: 40 * scale,
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 190 40" fill="none">
          <Rect x={0} y={24} width={8} height={12} rx={2} fill="white" />
          <Rect x={12} y={18} width={8} height={18} rx={2} fill="white" />
          <Rect x={24} y={11} width={8} height={25} rx={2} fill="white" />
          <Rect x={36} y={4} width={8} height={32} rx={2} fill="white" />
          <Path
            d="M65 12q20-18 40 0M72 20q13-12 26 0M80 28q5-5 11 0"
            stroke="white"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <Rect
            x={128}
            y={5}
            width={57}
            height={29}
            rx={7}
            stroke="white"
            strokeOpacity={0.7}
            strokeWidth={2.5}
          />
          <Rect x={132} y={9} width={49} height={21} rx={4} fill="white" />
          <Rect
            x={187}
            y={14}
            width={3}
            height={11}
            rx={1.5}
            fill="white"
            fillOpacity={0.65}
          />
        </Svg>
      </View>
    </View>
  );
}
