import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ChatBotInput() {
  return (
    <View style={styles.container}>
      <Ionicons name="git-network-outline" size={24} color={colors.textLight} />
      <Text style={styles.text}>Como posso te ajudar hoje?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 12,
  },
  text: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  }
});