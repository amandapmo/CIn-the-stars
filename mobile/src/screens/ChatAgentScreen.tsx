import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ChatAgentScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assistente Agronómico</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.chatArea}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} style={{ opacity: 0.5, marginBottom: 16 }} />
        <Text style={styles.placeholderText}>Histórico de mensagens do agente LangGraph...</Text>
      </View>

      <View style={styles.inputArea}>
        <Text style={styles.placeholderText}>Input de texto será aqui...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backButton: { padding: 4 },
  headerTitle: { color: colors.textLight, fontSize: 18, fontWeight: 'bold' },
  chatArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  inputArea: { padding: 20, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  placeholderText: { color: colors.textLight, opacity: 0.7, textAlign: 'center' }
});