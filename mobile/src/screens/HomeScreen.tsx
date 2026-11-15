import { StatusBar } from "expo-status-bar";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionCards, {
  getActionCardsHeight,
} from "../components/home/ActionCards";
import AssistantCallout from "../components/home/AssistantCallout";
import HomeBackground from "../components/home/HomeBackground";
import PlantingArtwork from "../components/home/PlantingArtwork";
import PlantingTimeline from "../components/home/PlantingTimeline";
import PreviewStatusBar from "../components/home/PreviewStatusBar";
import PrototypeHeader from "../components/home/PrototypeHeader";

export type HomeScreenProps = {
  onProfilePress?: () => void;
  onLocationPress?: () => void;
  onGrainPress?: () => void;
  onMenuPress?: () => void;
  onHistoryPress?: () => void;
  onComparePress?: () => void;
  onAnalyzePress?: () => void;
  onAssistantPress?: () => void;
};

export default function HomeScreen(props: HomeScreenProps) {
  const { width, fontScale } = useWindowDimensions();
  const canvasWidth = Math.min(width, 520);
  const scale = canvasWidth / 937;
  const topOffset = Platform.OS === "web" ? 0 : 90;
  const top = (value: number) => (value - topOffset) * scale;
  const cardsExtra = getActionCardsHeight(scale, fontScale) - 326 * scale;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <HomeBackground />
      </View>
      <StatusBar style="light" />
      <SafeAreaView
        edges={Platform.OS === "web" ? [] : ["top", "bottom"]}
        style={styles.safeArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: canvasWidth,
              height: (1678 - topOffset) * scale + cardsExtra,
              alignSelf: "center",
            }}
          >
            {Platform.OS === "web" && <PreviewStatusBar scale={scale} />}
            <View style={{ position: "absolute", left: 0, top: top(118) }}>
              <PrototypeHeader
                scale={scale}
                onProfilePress={props.onProfilePress}
                onLocationPress={props.onLocationPress}
                onGrainPress={props.onGrainPress}
                onMenuPress={props.onMenuPress}
              />
            </View>
            <View style={{ position: "absolute", left: 0, top: top(222) }}>
              <PlantingArtwork scale={scale} />
            </View>
            <View
              style={{ position: "absolute", left: 30 * scale, top: top(969) }}
            >
              <PlantingTimeline scale={scale} />
            </View>
            <View style={{ position: "absolute", left: 0, top: top(1182) }}>
              <ActionCards
                scale={scale}
                fontScale={fontScale}
                onHistoryPress={props.onHistoryPress}
                onComparePress={props.onComparePress}
                onAnalyzePress={props.onAnalyzePress}
              />
            </View>
            <View
              style={{
                position: "absolute",
                left: 218 * scale,
                top: top(1525) + cardsExtra,
              }}
            >
              <AssistantCallout
                scale={scale}
                onPress={props.onAssistantPress}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#626D20" },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
