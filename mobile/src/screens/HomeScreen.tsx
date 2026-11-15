import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, Alert, TouchableOpacity, Text } from 'react-native';
import { colors } from '../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

import TopBar from '../components/TopBar';
import CropClockWidget from '../components/CropClockWidget';
import ActionCards from '../components/ActionCards';
import ChatBotInput from '../components/ChatBotInput';
import CropSelectionSheet from '../components/CropSelectionSheet'; 
import PlantingWindowTimeline from '../components/PlantingWindowTimeline';

import { useRecommendation } from '../hooks/useRecommendation';
import { useAppLocation } from '../hooks/useLocation';
import { RecommendationRequest } from '../api/recommendation';

export default function HomeScreen({ navigation }: any) {
  const { fetchRecommendation, loading, data, error } = useRecommendation();
  const { coords, errorMsg, isLoadingLocation } = useAppLocation();

  const [selectedCrop, setSelectedCrop] = useState<RecommendationRequest['previous_crop']>('Corn');
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const handleAnalyzeNASA = () => {
    if (!coords) {
      Alert.alert("Aviso", "Aguarde a captura do GPS ou permita o acesso à localização.");
      return;
    }

    const payload: RecommendationRequest = {
      lat: coords.lat,
      lon: coords.lon,
      planting_month: new Date().getMonth() + 1,
      previous_crop: selectedCrop 
    };
    
    console.log("Enviando requisição...", payload);
    fetchRecommendation(payload);
  };

  useEffect(() => {
    if (data) {
      Alert.alert("Análise Concluída", `Status: ${data.recommendation_status}`);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      Alert.alert("Aviso Científico", error);
    }
  }, [error]);

  return (
    <LinearGradient 
      colors={['#6B8033', '#405B3A', '#243D51']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => setIsSheetVisible(true)}>
            <TopBar location="Pernambuco, BR" cropType={selectedCrop} />
          </TouchableOpacity>
          
          <View style={styles.clockContainer}>
            <CropClockWidget />
          </View>

          <PlantingWindowTimeline />

          <ActionCards onAnalyzePress={handleAnalyzeNASA} isLoading={loading} />
          
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatAgent')}>
            <ChatBotInput />
          </TouchableOpacity>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate('Camera')}
              accessibilityRole="button"
            >
              <Text style={styles.cameraButtonText}>Diagnóstico da folha</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
            >
              <Text style={styles.cameraButtonText}>Meu Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CropSelectionSheet 
          visible={isSheetVisible} 
          onClose={() => setIsSheetVisible(false)}
          currentCrop={selectedCrop}
          onSelectCrop={(crop) => setSelectedCrop(crop as RecommendationRequest['previous_crop'])}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 130 
  },
  clockContainer: { 
    alignItems: 'center', 
    marginTop: 0, 
    marginBottom: 20 
  },
  footer: { 
    position: 'absolute', 
    bottom: 40, 
    left: 16, 
    right: 16,
    gap: 10,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cameraButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
});