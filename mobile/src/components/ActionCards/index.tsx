import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../utils/colors';

interface ActionCardsProps {
  onAnalyzePress: () => void;
  isLoading: boolean;
}

export default function ActionCards({ onAnalyzePress, isLoading }: ActionCardsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.card, styles.cardSolo]}>
        <Text style={styles.cardSubtitle}>Precipitação / Solo</Text>
        <Text style={styles.cardTitle}>Aptidão{'\n'}de Solo</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Ver Histórico NASA</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardRotacoes]}>
        <Text style={styles.cardTitleCentered}>Rotações{'\n'}Sugeridas</Text>
        <View style={[styles.pill, styles.pillDark]}>
          <Text style={styles.pillTextDark}>Comparar</Text>
        </View>
      </TouchableOpacity>

      {/* Botão de Risco Climático agora aciona a API */}
      <TouchableOpacity 
        style={[styles.card, styles.cardRisco]} 
        onPress={onAnalyzePress}
        disabled={isLoading}
      >
        <Text style={[styles.cardTitleCentered, { color: colors.textDark }]}>
          Risco{'\n'}Climático
        </Text>
        <View style={[styles.pill, styles.pillDark, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textDark} />
          ) : (
            <Text style={[styles.pillTextDark, { color: colors.textDark }]}>Analisar</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 24 },
  card: { flex: 1, borderRadius: 16, padding: 12, minHeight: 140, justifyContent: 'space-between' },
  cardSolo: { backgroundColor: colors.surface },
  cardRotacoes: { backgroundColor: colors.secondary },
  cardRisco: { backgroundColor: colors.primary },
  cardTitle: { color: colors.textLight, fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  cardSubtitle: { color: colors.textLight, fontSize: 10, opacity: 0.8 },
  cardTitleCentered: { color: colors.textLight, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  pill: { backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  pillDark: { backgroundColor: 'rgba(0,0,0,0.2)' },
  pillText: { color: colors.textDark, fontSize: 10, fontWeight: 'bold' },
  pillTextDark: { color: colors.textLight, fontSize: 12, fontWeight: '600' }
});