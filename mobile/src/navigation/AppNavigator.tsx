import ProfileScreen from "../screens/ProfileScreen";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLanguage } from "../i18n/LanguageContext";
import { colors } from "../utils/colors";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ChatAgentScreen from "../screens/ChatAgentScreen";
import RotationResultScreen from "../screens/RotationResultScreen";
import CameraScreen from "../screens/CameraScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { t } = useLanguage();
  const [ended, setEnded] = useState(false);
  const [session, setSession] = useState(0);
  if (ended)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 20,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: colors.textLight, fontSize: 24 }}
        >
          {t("Sessão encerrada")}
        </Text>
        <Text style={{ color: colors.textLight, textAlign: "center" }}>
          {t(
            "A conversa e a seleção de localização foram encerradas neste aparelho.",
          )}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSession((value) => value + 1);
            setEnded(false);
          }}
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: colors.textDark }}>
            {t("Iniciar nova sessão")}
          </Text>
        </Pressable>
      </View>
    );
  return (
    <NavigationContainer>
      <Stack.Navigator key={session} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {(props) => (
            <HomeScreen {...props} onEndSession={() => setEnded(true)} />
          )}
        </Stack.Screen>
        <Stack.Screen name="ChatAgent" component={ChatAgentScreen} />
        <Stack.Screen name="RotationResult" component={RotationResultScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
