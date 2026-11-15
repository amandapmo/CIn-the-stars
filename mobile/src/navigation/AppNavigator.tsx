import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ChatAgentScreen from '../screens/ChatAgentScreen';
import RotationResultScreen from '../screens/RotationResultScreen'; 

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChatAgent" component={ChatAgentScreen} />
        <Stack.Screen name="RotationResult" component={RotationResultScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}