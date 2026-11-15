import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons'; 

interface TopBarProps {
  location: string;
  cropType: string;
}

export default function TopBar({ location, cropType }: TopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/40' }} 
          style={styles.avatar}
        />
        <View style={styles.chip}>
          <Ionicons name="location-outline" size={16} color={colors.textLight} />
          <Text style={styles.chipText}>{location}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.chip}>
          <Ionicons name="leaf-outline" size={16} color={colors.textLight} />
          <Text style={styles.chipText}>{cropType}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    color: colors.textLight,
    fontSize: 14,
  }
});