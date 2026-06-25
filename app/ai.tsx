import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { colors } from '@/theme';
import { ScreenShell } from '@/screen-shell';
import { apiGet, apiJson } from '@/api';
import { showError, showSuccess } from '@/toast';

export default function AiScreen() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const data: any = await apiGet('/ai/threads');
      setThreads((data.data ?? data ?? []).filter((thread: any) => !thread.archived));
    } catch (error: any) {
      showError(error.message ?? 'Failed to load threads');
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const openThread = async (thread: any) => {
    setActiveThread(thread);
    setHistory(thread.messages ?? []);
    setReply(thread.summary ?? '');
  };

  const send = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const data: any = await apiJson('/ai/chat', 'POST', { message, threadId: activeThread?.id, title: activeThread?.title });
      setReply(data.text ?? data.reply ?? '');
      setHistory((current) => [
        ...current,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: data.text ?? data.reply ?? '', timestamp: new Date().toISOString(), model: data.model },
      ]);
      setMessage('');
      showSuccess('Response saved');
      setActiveThread(data.thread);
      await loadThreads();
    } catch (error: any) {
      showError(error.message ?? 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const archiveThread = async (threadId: string) => {
    await apiJson(`/ai/threads/${threadId}/archive`, 'POST');
    showSuccess('Thread archived');
    if (activeThread?.id === threadId) {
      setActiveThread(null);
      setHistory([]);
      setReply('');
    }
    await loadThreads();
  };

  const deleteThread = async (threadId: string) => {
    Alert.alert('Delete thread', 'This will permanently delete the conversation thread.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiJson(`/ai/threads/${threadId}/delete`, 'POST');
          showSuccess('Thread deleted');
          if (activeThread?.id === threadId) {
            setActiveThread(null);
            setHistory([]);
            setReply('');
          }
          await loadThreads();
        },
      },
    ]);
  };

  const historyView = useMemo(() => history, [history]);

  return (
    <ScreenShell title="ACE Assistant">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <View style={styles.inputHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={styles.subtitle}>Smart Academic Assistant</Text>
          </View>
          <TextInput 
            value={message} 
            onChangeText={setMessage} 
            placeholder="Ask me anything about your studies..." 
            placeholderTextColor="#7E92B9" 
            style={styles.input} 
            multiline 
          />
          <View style={styles.sendRow}>
            {loading ? <ActivityIndicator color={colors.primary} style={{ marginRight: 12 }} /> : null}
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Send Message" onPress={send} />
            </View>
          </View>
        </GlassCard>

        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Conversation History</Text>
          {historyView.length === 0 ? (
            <GlassCard style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.muted} />
              <Text style={styles.replyBody}>Your AI study companion is ready. Start a conversation above.</Text>
            </GlassCard>
          ) : (
            <View style={styles.historyList}>
              {historyView.map((entry, index) => (
                <View key={`${entry.role}-${index}`} style={[styles.msgWrapper, entry.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  <View style={[styles.bubble, entry.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.msgBody, entry.role === 'user' ? styles.userMsg : styles.aiMsg]}>{entry.content}</Text>
                  </View>
                  <Text style={styles.msgStamp}>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.threadsSection}>
          <View style={styles.threadHeaderRow}>
            <Text style={styles.sectionTitle}>Saved Threads</Text>
            {loadingThreads ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <FlatList
            data={threads}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GlassCard style={[styles.threadCard, activeThread?.id === item.id && styles.threadActive]}>
                <Pressable onPress={() => openThread(item)} style={styles.threadPress}>
                  <View style={styles.threadInfo}>
                    <Text style={styles.threadTitle}>{item.title}</Text>
                    <Text style={styles.threadSub} numberOfLines={1}>{item.summary ?? 'New conversation'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
                
                <View style={styles.threadFooter}>
                  <Text style={styles.threadStamp}>
                    {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString() : 'Just now'}
                  </Text>
                  <View style={styles.threadActions}>
                    <Pressable onPress={() => archiveThread(item.id)} style={styles.actionBtn}><Ionicons name="archive-outline" size={16} color={colors.primary} /></Pressable>
                    <Pressable onPress={() => deleteThread(item.id)} style={styles.actionBtn}><Ionicons name="trash-outline" size={16} color={colors.danger} /></Pressable>
                  </View>
                </View>
              </GlassCard>
            )}
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 20, paddingBottom: 40 },
  card: { padding: 18, gap: 14 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtitle: { color: '#B2C3E1', fontSize: 14, fontWeight: '700' },
  input: { minHeight: 100, borderRadius: 16, backgroundColor: '#101F39', padding: 16, color: '#fff', fontSize: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sendRow: { flexDirection: 'row', alignItems: 'center' },
  chatSection: { gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  emptyChat: { padding: 24, alignItems: 'center', gap: 12, borderStyle: 'dashed', backgroundColor: 'transparent' },
  historyList: { gap: 16 },
  msgWrapper: { maxWidth: '85%', gap: 4 },
  userWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  aiWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: 4 },
  msgBody: { fontSize: 15, lineHeight: 22 },
  userMsg: { color: '#fff' },
  aiMsg: { color: '#E1E9F5' },
  msgStamp: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  replyBody: { color: '#B2C3E1', lineHeight: 22, textAlign: 'center' },
  threadsSection: { gap: 12 },
  threadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadCard: { padding: 16, gap: 12, marginBottom: 12 },
  threadActive: { borderColor: colors.primary, borderWidth: 1.5 },
  threadPress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadInfo: { flex: 1, gap: 4 },
  threadTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  threadSub: { color: '#B2C3E1', fontSize: 13 },
  threadFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  threadStamp: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  threadActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { padding: 4 },
});
