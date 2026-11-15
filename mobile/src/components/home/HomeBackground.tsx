import Svg, { Defs, LinearGradient, Mask, Rect, Stop } from "react-native-svg";

export default function HomeBackground() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 937 1678"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id="home-left" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#747B03" />
          <Stop offset="0.36" stopColor="#778003" />
          <Stop offset="0.70" stopColor="#304B4B" />
          <Stop offset="1" stopColor="#345171" />
        </LinearGradient>
        <LinearGradient id="home-right" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#566732" />
          <Stop offset="0.36" stopColor="#305353" />
          <Stop offset="0.70" stopColor="#38556D" />
          <Stop offset="1" stopColor="#5B7AA0" />
        </LinearGradient>
        <LinearGradient id="home-fade" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="white" stopOpacity={0} />
          <Stop offset="1" stopColor="white" stopOpacity={1} />
        </LinearGradient>
        <Mask id="home-right-mask" maskType="alpha">
          <Rect width="100%" height="100%" fill="url(#home-fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#home-left)" />
      <Rect
        width="100%"
        height="100%"
        fill="url(#home-right)"
        mask="url(#home-right-mask)"
      />
    </Svg>
  );
}
