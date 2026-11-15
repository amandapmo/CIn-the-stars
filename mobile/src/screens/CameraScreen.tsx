import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />; // Carregando permissões
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Precisamos da sua permissão para usar a câmera.</Text>
        <Button onPress={requestPermission} title="Conceder Permissão" />
      </View>
    );
  }

  const tirarFoto = async () => {
    if (isLoading) {
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Erro', 'A câmera ainda não está pronta. Tente novamente.');
      return;
    }

    setIsLoading(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({ base64: true });
      if (!foto.base64) {
        throw new Error('Não foi possível converter a foto para envio.');
      }

      const response = await fetch('http://172.24.48.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: foto.base64 }),
      });
      const result: {
        disease_detected?: string;
        disease?: string;
        result?: string;
        confidence_score?: number;
        confidence?: number;
        detail?: string;
        message?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(result.detail ?? result.message ?? 'O servidor não conseguiu analisar a imagem.');
      }

      const diagnosis = result.disease_detected ?? result.disease ?? result.result;
      if (!diagnosis) {
        throw new Error('O servidor não retornou o diagnóstico da folha.');
      }

      const confidence = result.confidence_score ?? result.confidence;
      const confidenceText = typeof confidence === 'number'
        ? `\nConfiança: ${Math.round(confidence <= 1 ? confidence * 100 : confidence)}%`
        : '';
      Alert.alert('Diagnóstico da folha', `${diagnosis}${confidenceText}`);
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Falha ao enviar a foto para análise.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={tirarFoto}
            disabled={isLoading}
          >
            <Text style={styles.text}>{isLoading ? 'Enviando foto...' : '📸 Capturar Folha'}</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  buttonContainer: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent', margin: 64 },
  button: { flex: 1, alignSelf: 'flex-end', alignItems: 'center', backgroundColor: '#000000a0', padding: 15, borderRadius: 10 },
  disabledButton: { opacity: 0.6 },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});