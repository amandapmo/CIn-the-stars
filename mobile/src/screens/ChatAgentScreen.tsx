import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform,
  ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { sendChatMessage, type ChatSession } from '../api/chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: { title: string; url: string }[];
}

export default function ChatAgentScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [crop, setCrop] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const sending = useRef(false);
  const scrollView = useRef<React.ComponentRef<typeof ScrollView>>(null);

  async function selectPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], base64: true, quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (!result.canceled) {
        if (!result.assets[0].base64) {
          Alert.alert('Fotografia', 'Não foi possível ler a foto. Escolha uma imagem JPEG ou PNG.');
          return;
        }
        setPhoto(result.assets[0]);
      }
    } catch {
      Alert.alert('Fotografia', 'Não foi possível abrir a galeria.');
    }
  }

  async function sendMessage() {
    if (sending.current || (!text.trim() && !photo)) return;
    if (Date.now() < retryAt) {
      Alert.alert('Aguarde', 'O limite temporário do assistente ainda está ativo. Sua conversa foi preservada.');
      return;
    }
    sending.current = true;
    setLoading(true);
    try {
      const result = await sendChatMessage(text.trim(), crop.trim(), photo?.base64 || null, session);
      setSession({ thread_id: result.thread_id, session_token: result.session_token });
      setRetryAt(result.retry_after ? Date.now() + result.retry_after * 1000 : 0);
      setMessages(previous => [...previous,
        { role: 'user', text: text.trim() || 'Fotografia de uma folha.' },
        { role: 'assistant', text: result.response, sources: result.sources },
      ]);
      setText('');
      setPhoto(null);
    } catch (error) {
      Alert.alert('Assistente', error instanceof Error ? error.message : 'Não foi possível enviar.');
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assistente Agronómico</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollView} style={{ flex: 1 }} contentContainerStyle={messages.length ? styles.messages : styles.chatArea}
        onContentSizeChange={() => scrollView.current?.scrollToEnd({ animated: true })}>
        {!messages.length && <>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} style={{ opacity: 0.5, marginBottom: 16 }} />
        <Text style={styles.placeholderText}>Envie uma folha bem enquadrada, com fundo neutro. As respostas são suspeitas, não diagnósticos.</Text>
        </>}
        {messages.map((message, index) => <View key={index} style={styles.message}>
          <Text style={styles.headerTitle}>{message.role === 'user' ? 'Você' : 'Assistente'}</Text>
          <Text selectable style={styles.messageText}>{message.text}</Text>
          {message.sources?.map(source => <TouchableOpacity key={source.url} onPress={() => {
            if (/^https?:\/\//i.test(source.url)) {
              void Linking.openURL(source.url).catch(() => Alert.alert('Fonte', 'Não foi possível abrir o link.'));
            }
          }}><Text style={styles.source}>{source.title}</Text></TouchableOpacity>)}
        </View>)}
        {loading && <ActivityIndicator color={colors.textLight} />}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput style={styles.input} value={crop} onChangeText={setCrop} maxLength={100}
          editable={!loading} placeholder="Cultura, se souber (ex.: batata)" placeholderTextColor="#aaa" />
        {photo && <TouchableOpacity disabled={loading} onPress={() => setPhoto(null)}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <Text style={styles.placeholderText}>Remover fotografia</Text>
        </TouchableOpacity>}
        <TextInput style={styles.input} value={text} onChangeText={setText} multiline maxLength={3000}
          editable={!loading} placeholder="Descreva o que observou…" placeholderTextColor="#aaa" />
        <View style={styles.actions}>
          <TouchableOpacity disabled={loading} onPress={() => void selectPhoto()} accessibilityLabel="Selecionar fotografia">
            <Ionicons name="image-outline" size={28} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity disabled={loading || (!text.trim() && !photo)} onPress={() => void sendMessage()}>
            <Text style={styles.headerTitle}>{loading ? 'Aguarde…' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
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
  placeholderText: { color: colors.textLight, opacity: 0.7, textAlign: 'center' },
  messages: { padding: 16 },
  message: { marginBottom: 16 },
  messageText: { color: colors.textLight, lineHeight: 22, marginVertical: 8 },
  source: { color: colors.textLight, textDecorationLine: 'underline', marginBottom: 8 },
  input: { color: colors.textLight, paddingVertical: 10, maxHeight: 100 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  preview: { width: 64, height: 64, alignSelf: 'center' },
});
