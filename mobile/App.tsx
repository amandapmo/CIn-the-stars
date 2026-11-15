<<<<<<< HEAD
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
=======
import React from "react";
import RotationResultScreen from "./src/screens/RotationResultScreen";

export default function App() {
  return <RotationResultScreen />;
}
>>>>>>> fbb1a48fbb94c4988a3db14263b9a176c5d5b804
