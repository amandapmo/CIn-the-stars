import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

export default function CropClockWidget() {
  const size = 260; 
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  
  const seedPositions = [
    { x: cx - 55, y: cy - 40, healthy: false },
    { x: cx - 25, y: cy - 70, healthy: false },
    { x: cx - 75, y: cy + 10, healthy: false },
    { x: cx - 45, y: cy + 50, healthy: false },
    { x: cx - 15, y: cy + 75, healthy: false },
    { x: cx - 20, y: cy + 25, healthy: false },
    { x: cx + 15, y: cy + 65, healthy: false },
    { x: cx + 55, y: cy + 45, healthy: false },
    { x: cx + 45, y: cy + 80, healthy: false },
    { x: cx - 65, y: cy - 10, healthy: false },
    { x: cx - 40, y: cy - 20, healthy: false },
    { x: cx + 5,  y: cy + 45, healthy: false },
    { x: cx + 75, y: cy + 15, healthy: false },

    { x: cx + 25, y: cy - 25, healthy: true },
    { x: cx + 50, y: cy - 15, healthy: true },
    { x: cx + 70, y: cy - 45, healthy: true },
    { x: cx + 35, y: cy - 65, healthy: true },
    { x: cx + 55, y: cy - 55, healthy: true },
    { x: cx + 80, y: cy - 25, healthy: true },
    { x: cx + 15, y: cy - 50, healthy: true },
    { x: cx + 40, y: cy - 40, healthy: true },
    { x: cx + 60, y: cy - 75, healthy: true },
    { x: cx + 25, y: cy - 80, healthy: true },
  ];

  const renderPlant = (plant: any, index: number) => {
    if (plant.healthy) {
      return (
        <G key={index} x={plant.x} y={plant.y}>
          <Path d="M 0 0 C 0 -4, 2 -7, 2 -11" stroke="#3E4C1F" strokeWidth="1.5" fill="none" opacity="0.6" />
          <Path d="M 1 -3 C -3 -6, -4 -1, 0 0 Z" fill="#3E4C1F" opacity="0.6" />
          <Path d="M 2 -7 C 7 -10, 8 -4, 2 -3 Z" fill="#3E4C1F" opacity="0.6" />
        </G>
      );
    } else {
      const isRight = index % 2 === 0;
      if (isRight) {
        return (
          <G key={index} x={plant.x} y={plant.y}>
            <Path d="M 0 0 Q 3 -8, 9 -3" stroke="#3E4C1F" strokeWidth="1.5" fill="none" opacity="0.3" />
            <Path d="M 5 -4 Q 10 -8, 9 -3 Z" fill="#3E4C1F" opacity="0.3" />
          </G>
        );
      } else {
        return (
          <G key={index} x={plant.x} y={plant.y}>
            <Path d="M 0 0 Q -3 -8, -9 -3" stroke="#3E4C1F" strokeWidth="1.5" fill="none" opacity="0.3" />
            <Path d="M -5 -4 Q -10 -8, -9 -3 Z" fill="#3E4C1F" opacity="0.3" />
          </G>
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>mês inicial</Text>
      
      <View style={styles.clockWrapper}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="65%" stopColor="#E9C46A" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Circle cx={cx} cy={cy} r={radius + 15} fill="url(#glow)" />
          
          <Circle cx={cx} cy={cy} r={radius} fill="#D98A52" opacity={0.9} />
          
          <Path 
            d={`M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy} Z`} 
            fill="#E9C46A" opacity={0.9} 
          />

          {seedPositions.map((plant, index) => renderPlant(plant, index))}

          <Circle cx={cx} cy={cy} r={radius} stroke="#E9C46A" strokeWidth={strokeWidth} fill="none" opacity={0.9} />

          <Circle 
            cx={cx} cy={cy} r={radius} 
            stroke={colors.indicatorVerde} 
            strokeWidth={strokeWidth} fill="none" 
            strokeDasharray={radius * 2 * Math.PI}
            strokeDashoffset={(radius * 2 * Math.PI) * 0.75}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx}, ${cy}`}
          />

          <G rotation={0} origin={`${cx}, ${cy}`}>
            <Path d={`M${cx - 3} ${cy} L${cx - 1} ${cy - 85} L${cx + 1} ${cy - 85} L${cx + 3} ${cy} Z`} fill="#2C3A12" />
            <Path d={`M${cx} ${cy - 85} Q${cx - 15} ${cy - 100} ${cx} ${cy - 110} Q${cx + 15} ${cy - 100} ${cx} ${cy - 85} Z`} fill="#2C3A12" />
          </G>

          <G rotation={90} origin={`${cx}, ${cy}`}>
            <Path d={`M${cx - 3} ${cy} L${cx - 1} ${cy - 85} L${cx + 1} ${cy - 85} L${cx + 3} ${cy} Z`} fill="#2C3A12" opacity={0.8} />
            <Path d={`M${cx} ${cy - 85} Q${cx - 15} ${cy - 100} ${cx} ${cy - 110} Q${cx + 15} ${cy - 100} ${cx} ${cy - 85} Z`} fill="#2C3A12" opacity={0.8} />
          </G>

          <Circle cx={cx} cy={cy} r={10} fill="#2C3A12" />
        </Svg>
        
        <View style={[styles.borderMarker, { top: cy - 10, right: 0 }]}>
           <Ionicons name="location" size={14} color="#E9C46A" />
        </View>

        <View style={styles.bottomIcon}>
          <Ionicons name="leaf" size={26} color="#3E4C1F" />
        </View>
      </View>

      <Text style={styles.monthLabelBottom}>mês final</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 0 },
  monthLabel: { color: colors.primary, fontSize: 15, fontWeight: '600', marginBottom: -10, zIndex: 10, elevation: 5 },
  monthLabelBottom: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: -15, zIndex: 10 },
  clockWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  borderMarker: { position: 'absolute', backgroundColor: '#3E4C1F', borderRadius: 12, padding: 4, right: 10, elevation: 4 },
  bottomIcon: { position: 'absolute', backgroundColor: colors.primary, padding: 10, borderRadius: 30, bottom: -5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 5 }
});