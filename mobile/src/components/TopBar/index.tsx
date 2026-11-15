import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";

interface TopBarProps {
  location: string;
  cropType: string;
  onLocationPress?: () => void;
  onCropPress?: () => void;
}

export default function TopBar({
  location,
  cropType,
  onLocationPress,
  onCropPress,
}: TopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={24} color={colors.textLight} />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Escolher município. ${location}`}
          onPress={onLocationPress}
          style={styles.chip}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textLight}
          />
          <Text numberOfLines={1} style={styles.chipText}>
            {location}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Escolher cultura"
          onPress={onCropPress}
          style={styles.chip}
        >
          <Ionicons name="leaf-outline" size={16} color={colors.textLight} />
          <Text style={styles.chipText}>{cropType}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexShrink: 1,
  },
  chipText: {
    color: colors.textLight,
    fontSize: 14,
    flexShrink: 1,
  },
});
