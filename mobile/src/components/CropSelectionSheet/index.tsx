import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { colors } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";

interface CropSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectCrop: (crop: string) => void;
  currentCrop: string;
}

const CROP_OPTIONS = [
  { id: "None", label: "Nenhuma (Primeiro Plantio)" },
  { id: "Corn", label: "Milho (Corn)" },
  { id: "Cassava", label: "Mandioca (Cassava)" },
  { id: "Cowpea", label: "Feijão-caupi (Cowpea)" },
  { id: "Forage Cactus", label: "Palma Forrageira" },
  { id: "Soybean", label: "Soja (Soybean)" },
  { id: "Wheat", label: "Trigo (Wheat)" },
  { id: "Quinoa", label: "Quinoa" },
  { id: "Potato", label: "Batata (Potato)" },
];

export default function CropSelectionSheet({
  visible,
  onClose,
  onSelectCrop,
  currentCrop,
}: CropSelectionSheetProps) {
  const { t } = useLanguage();
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t("Cultura Anterior")}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("Voltar")}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={CROP_OPTIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: currentCrop === item.id }}
                aria-pressed={currentCrop === item.id}
                style={[
                  styles.option,
                  currentCrop === item.id && styles.optionSelected,
                ]}
                onPress={() => {
                  onSelectCrop(item.id);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentCrop === item.id && styles.optionTextSelected,
                  ]}
                >
                  {t(item.label)}
                </Text>
                {currentCrop === item.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.textLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.textDark },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionSelected: { backgroundColor: "rgba(233, 196, 106, 0.1)" },
  optionText: { fontSize: 16, color: colors.textDark },
  optionTextSelected: { fontWeight: "bold", color: colors.primary },
});
