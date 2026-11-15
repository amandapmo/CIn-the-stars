import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TIMELINE_STEPS = [
  { id: '1', day: 'Tue', icon: 'check', color: colors.textLight, size: 16 },
  { id: '2', day: 'Wed', icon: 'seed-outline', color: colors.indicatorVerde, size: 16 },
  { id: '3', day: 'Thu', icon: 'seed', color: colors.indicatorVerde, size: 18 },
  { id: '4', day: 'Fri', icon: 'sprout', color: colors.indicatorVerde, size: 22 },
  { id: '5', day: 'Sat', icon: 'leaf', color: colors.indicatorVerde, size: 24 },
  { id: '6', day: 'Sun', icon: 'tree', color: colors.indicatorVerde, size: 26 },
  { id: '7', day: 'Mon', icon: 'star', color: 'rgba(255,255,255,0.4)', size: 16 },
];

export default function PlantingWindowTimeline() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Janela de Plantio</Text>
      
      <View style={styles.timelineContainer}>
        <View style={styles.backgroundLine} />
        
        <View style={styles.stepsRow}>
          {TIMELINE_STEPS.map((step) => (
            <View key={step.id} style={styles.stepWrapper}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={step.icon as any} size={step.size} color={step.color} />
              </View>
              <Text style={styles.dayText}>{step.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  title: { color: colors.textLight, fontSize: 14, textAlign: 'center', marginBottom: 16, opacity: 0.9 },
  timelineContainer: { position: 'relative', justifyContent: 'center' },
  backgroundLine: { position: 'absolute', top: 14, left: 10, right: 10, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepWrapper: { alignItems: 'center', gap: 8 },
  iconContainer: { height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 2 },
  dayText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
});