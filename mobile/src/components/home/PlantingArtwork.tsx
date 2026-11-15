import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  Image,
  Mask,
  RadialGradient,
  Stop,
} from "react-native-svg";

const reference = require("../../../assets/design/screen-reference.png");

export default function PlantingArtwork({ scale }: { scale: number }) {
  return (
    <View style={{ width: 937 * scale, height: 720 * scale }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Ilustração da janela de plantio"
        style={StyleSheet.absoluteFill}
      >
        <Svg width="100%" height="100%" viewBox="0 222 937 720">
          <Defs>
            <RadialGradient
              id="field-glow"
              cx={463}
              cy={589}
              rx={338}
              ry={338}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0.84" stopColor="#FFD15F" stopOpacity={0} />
              <Stop offset="0.89" stopColor="#FFD15F" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#FFD15F" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="field-mask"
              cx={463}
              cy={589}
              rx={304}
              ry={312}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0.96" stopColor="white" stopOpacity={1} />
              <Stop offset="1" stopColor="white" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="badge-mask"
              cx={463}
              cy={864}
              rx={73}
              ry={73}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0.95" stopColor="white" stopOpacity={1} />
              <Stop offset="1" stopColor="white" stopOpacity={0} />
            </RadialGradient>
            <Mask
              id="planting-artwork-mask"
              x={0}
              y={0}
              width={937}
              height={1678}
              maskUnits="userSpaceOnUse"
              maskType="alpha"
            >
              <Ellipse
                cx={463}
                cy={589}
                rx={304}
                ry={312}
                fill="url(#field-mask)"
              />
              <Ellipse
                cx={463}
                cy={864}
                rx={73}
                ry={73}
                fill="url(#badge-mask)"
              />
            </Mask>
          </Defs>
          <Ellipse
            cx={463}
            cy={589}
            rx={338}
            ry={338}
            fill="url(#field-glow)"
          />
          <Image
            href={reference}
            x={0}
            y={0}
            width={937}
            height={1678}
            mask="url(#planting-artwork-mask)"
          />
        </Svg>
      </View>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          styles.label,
          {
            top: 8 * scale,
            width: 937 * scale,
            fontSize: 36 * scale,
            lineHeight: 46 * scale,
            textAlign: "center",
          },
        ]}
      >
        mês inicial
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          styles.label,
          {
            left: 770 * scale,
            top: 341 * scale,
            width: 167 * scale,
            fontSize: 36 * scale,
            lineHeight: 46 * scale,
          },
        ]}
      >
        mês final
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: "absolute", color: "#E7E8D6", fontWeight: "400" },
});
