import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Image as SvgImage,
  Path,
} from "react-native-svg";

export type PrototypeHeaderProps = {
  scale: number;
  onProfilePress?: () => void;
  onLocationPress?: () => void;
  onGrainPress?: () => void;
  onMenuPress?: () => void;
};

export default function PrototypeHeader({
  scale,
  onProfilePress,
  onLocationPress,
  onGrainPress,
  onMenuPress,
}: PrototypeHeaderProps) {
  return (
    <View style={{ width: 937 * scale, height: 100 * scale }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Perfil"
        disabled={!onProfilePress}
        onPress={onProfilePress}
        style={{
          position: "absolute",
          left: 30 * scale,
          top: 0,
          width: 90 * scale,
          height: 90 * scale,
        }}
      >
        <Svg width={90 * scale} height={90 * scale} viewBox="30 120 90 90">
          <Defs>
            <ClipPath id="prototype-avatar-clip">
              <Circle cx={75} cy={165} r={45} />
            </ClipPath>
          </Defs>
          <SvgImage
            href={require("../../../assets/design/screen-reference.png")}
            x={0}
            y={0}
            width={937}
            height={1678}
            clipPath="url(#prototype-avatar-clip)"
          />
        </Svg>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pernambuco, BR"
        disabled={!onLocationPress}
        onPress={onLocationPress}
        style={[
          styles.pill,
          {
            left: 145 * scale,
            top: 5 * scale,
            width: 354 * scale,
            height: 80 * scale,
            borderRadius: 40 * scale,
          },
        ]}
      >
        <Svg
          width={29 * scale}
          height={40 * scale}
          viewBox="0 0 29 40"
          style={{ position: "absolute", left: 28 * scale, top: 20 * scale }}
        >
          <Path
            d="M14.5 39C11 34 1 23 1 15a13.5 13.5 0 1 1 27 0c0 8-10 19-13.5 24Z"
            fill="#e5d57c"
          />
          <Circle cx={14.5} cy={15} r={4.5} fill="#77873a" />
        </Svg>
        <Text
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={[
            styles.label,
            {
              left: 72 * scale,
              width: 277 * scale,
              fontSize: 34 * scale,
              lineHeight: 80 * scale,
            },
          ]}
        >
          Pernambuco, BR
        </Text>
      </Pressable>
      <View
        style={[
          styles.pill,
          {
            left: 552 * scale,
            top: 5 * scale,
            width: 362 * scale,
            height: 80 * scale,
            borderRadius: 40 * scale,
          },
        ]}
      >
        <View
          style={{
            position: "absolute",
            left: 270 * scale,
            top: -10 * scale,
            width: 90 * scale,
            height: 100 * scale,
            borderRadius: 50 * scale,
            backgroundColor: "rgba(176, 191, 166, 0.18)",
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tipo de Grão"
          disabled={!onGrainPress}
          onPress={onGrainPress}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 300 * scale,
            height: 80 * scale,
          }}
        >
          <Svg
            width={34 * scale}
            height={50 * scale}
            viewBox="0 0 34 50"
            style={{ position: "absolute", left: 42 * scale, top: 15 * scale }}
          >
            <Path
              d="M17 49V18M17 20C7 19 2 15 3 7c7 2 12 6 14 13ZM17 32C7 31 2 27 3 19c7 2 12 6 14 13ZM17 44C7 43 2 39 3 31c7 2 12 6 14 13ZM18 20C28 19 33 15 32 7c-7 2-12 6-14 13ZM18 32C28 31 33 27 32 19c-7 2-12 6-14 13ZM18 44C28 43 33 39 32 31c-7 2-12 6-14 13ZM17 16C9 12 10 7 17 0c7 7 8 12 0 16Z"
              fill="#e5d28a"
              stroke="#e5d28a"
              strokeWidth={1}
            />
          </Svg>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={[
              styles.label,
              {
                left: 86 * scale,
                width: 215 * scale,
                fontSize: 34 * scale,
                lineHeight: 80 * scale,
              },
            ]}
          >
            Tipo de Grão
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          disabled={!onMenuPress}
          onPress={onMenuPress}
          style={{
            position: "absolute",
            left: 270 * scale,
            top: -10 * scale,
            width: 90 * scale,
            height: 100 * scale,
          }}
        >
          <Svg width={90 * scale} height={100 * scale} viewBox="0 0 90 100">
            <Circle cx={45} cy={27} r={7} fill="#f2f5f4" />
            <Circle cx={45} cy={50} r={7} fill="#f2f5f4" />
            <Circle cx={45} cy={73} r={7} fill="#f2f5f4" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { position: "absolute", backgroundColor: "rgba(184, 181, 117, 0.22)" },
  label: {
    position: "absolute",
    top: 0,
    color: "#e4ce77",
    fontWeight: "400",
    includeFontPadding: false,
  },
});
