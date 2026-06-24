import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
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
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Text style={styles.subtitle}>Ask about deadlines, study plans, progress, exam prep, or generate a revision timetable.</Text>
          <TextInput value={message} onChangeText={setMessage} placeholder="What should I study today?" placeholderTextColor="#7E92B9" style={styles.input} multiline />
          <PrimaryButton title="Send" onPress={send} />
          {loading ? <ActivityIndicator color="#fff" /> : null}
        </GlassCard>

        <GlassCard style={styles.replyCard}>
          <Text style={styles.replyTitle}>Conversation</Text>
          {historyView.length === 0 ? <Text style={styles.replyBody}>Your chat history will appear here.</Text> : historyView.map((entry, index) => (
            <View key={`${entry.role}-${index}`} style={styles.messageBlock}>
              <View style={styles.messageTop}>
                <Text style={styles.messageRole}>{entry.role}</Text>
                <Text style={styles.messageStamp}>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</Text>
              </View>
              <Text style={styles.messageBody}>{entry.content}</Text>
            </View>
          ))}
          <Text style={styles.replyTitle}>Latest Reply</Text>
          <Text style={styles.replyBody}>{reply || 'Your AI response will appear here.'}</Text>
        </GlassCard>

        <Text style={styles.threadHeader}>Saved Threads</Text>
        {loadingThreads ? <ActivityIndicator color="#fff" /> : null}
        <FlatList
          data={threads}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GlassCard style={[styles.threadCard, activeThread?.id === item.id && styles.threadActive]}>
              <Pressable onPress={() => openThread(item)} style={{ gap: 6 }}>
                <Text style={styles.threadTitle}>{item.title}</Text>
                <Text style={styles.threadSub} numberOfLines={2}>{item.summary ?? 'No summary yet'}</Text>
              </Pressable>
              <Text style={styles.threadStamp}>
                {item.last_message_at ? new Date(item.last_message_at).toLocaleString() : ''}
              </Text>
              <View style={styles.threadActions}>
                <Pressable onPress={() => openThread(item)}><Text style={styles.threadAction}>Open</Text></Pressable>
                <Pressable onPress={() => archiveThread(item.id)}><Text style={styles.threadAction}>Archive</Text></Pressable>
                <Pressable onPress={() => deleteThread(item.id)}><Text style={[styles.threadAction, styles.threadDanger]}>Delete</Text></Pressable>
              </View>
            </GlassCard>
          )}
        />
      </ScrollView>
    </GradientShell>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 14, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  card: { padding: 16, gap: 12 },
  subtitle: { color: '#B2C3E1', lineHeight: 22 },
  input: { minHeight: 120, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(148,175,230,0.18)', backgroundColor: '#101F39', padding: 14, color: '#fff', textAlignVertical: 'top' },
  replyCard: { padding: 16, gap: 10 },
  replyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  replyBody: { color: '#B2C3E1', lineHeight: 22 },
  messageBlock: { gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(148,175,230,0.12)' },
  messageTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  messageRole: { color: '#86A8FF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  messageStamp: { color: '#8DA3C7', fontSize: 11, fontWeight: '700' },
  messageBody: { color: '#fff', lineHeight: 20 },
  threadHeader: { color: '#fff', fontSize: 18, fontWeight: '900' },
  threadCard: { padding: 14, gap: 8, marginBottom: 10 },
  threadActive: { borderColor: '#3D7CFF' },
  threadTitle: { color: '#fff', fontWeight: '900' },
  threadSub: { color: '#B2C3E1', fontSize: 12, lineHeight: 18 },
  threadStamp: { color: '#8DA3C7', fontSize: 11, fontWeight: '700' },
  threadActions: { flexDirection: 'row', gap: 14 },
  threadAction: { color: '#86A8FF', fontWeight: '800' },
  threadDanger: { color: '#FF6B6B' },
});
