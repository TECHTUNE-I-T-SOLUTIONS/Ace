import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { apiGet, apiJson } from '../src/api';
import { showError, showSuccess } from '../src/toast';

export default function AiScreen() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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
    setShowHistory(false);
  };

  const send = async () => {
    if (!message.trim()) return;
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setHistory(prev => [...prev, userMsg]);
    const currentMsg = message;
    setMessage('');
    setLoading(true);
    
    try {
      const data: any = await apiJson('/ai/chat', 'POST', { message: currentMsg, threadId: activeThread?.id, title: activeThread?.title });
      const aiReply = { role: 'assistant', content: data.text ?? data.reply ?? '', timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiReply]);
      setActiveThread(data.thread);
      await loadThreads();
    } catch (error: any) {
      showError(error.message ?? 'AI request failed');
    } finally {
      setLoading(false);
      // Delay scroll to ensure content is rendered
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <ScreenShell 
      title="ACE Assistant" 
      subtitle={activeThread?.title || 'Smart Study Partner'}
      rightAction={
        <Pressable onPress={() => setShowHistory(true)} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={24} color="#fff" />
        </Pressable>
      }
    >
      <View style={styles.container}>
        {/* Chat Area */}
        <View style={styles.chatArea}>
          <ScrollView 
            ref={scrollRef}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="sparkles" size={40} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>AI Study Companion</Text>
                <Text style={styles.emptySub}>Ask about deadlines, concepts, or study plans. Your history is saved for later.</Text>
              </View>
            ) : (
              history.map((entry, index) => (
                <View key={index} style={[styles.msgWrapper, entry.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  <View style={[styles.bubble, entry.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                    {entry.role === 'user' ? (
                      <Text style={[styles.msgText, styles.userText]}>{entry.content}</Text>
                    ) : (
                      <Markdown style={markdownStyles}>{entry.content}</Markdown>
                    )}
                  </View>
                  <Text style={styles.msgTime}>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              ))
            )}
            {loading && (
              <View style={styles.aiWrapper}>
                <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 14 }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <GlassCard style={styles.inputCard}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={colors.muted}
                style={[styles.input, { maxHeight: 120 }]}
                multiline
              />
              <Pressable onPress={send} disabled={!message.trim() || loading} style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}>
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </GlassCard>
          </View>
        </View>

        {/* Sidebar Modal (History) */}
        <Modal visible={showHistory} transparent animationType="fade" onRequestClose={() => setShowHistory(false)}>
          <View style={styles.sidebarOverlay}>
            <Pressable style={styles.sidebarBackdrop} onPress={() => setShowHistory(false)} />
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Chat History</Text>
                <Pressable onPress={() => setShowHistory(false)} style={styles.closeSidebar}>
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>
              
              <View style={{ paddingHorizontal: 16 }}>
                <PrimaryButton 
                  title="New Conversation" 
                  icon="add" 
                  onPress={() => {
                    setActiveThread(null);
                    setHistory([]);
                    setShowHistory(false);
                  }} 
                />
              </View>

              <View style={styles.sidebarContent}>
                {loadingThreads ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {threads.length === 0 ? (
                      <Text style={styles.noThreads}>No saved threads yet.</Text>
                    ) : (
                      threads.map((item) => (
                        <Pressable 
                          key={item.id} 
                          onPress={() => openThread(item)}
                          style={[styles.threadItem, activeThread?.id === item.id && styles.threadItemActive]}
                        >
                          <View style={styles.threadIcon}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={activeThread?.id === item.id ? colors.primary : colors.muted} />
                          </View>
                          <View style={styles.threadInfo}>
                            <Text style={[styles.threadName, activeThread?.id === item.id && styles.activeText]} numberOfLines={1}>
                              {item.title || 'Untitled Chat'}
                            </Text>
                            <Text style={styles.threadDate}>{new Date(item.last_message_at || item.created_at).toLocaleDateString()}</Text>
                          </View>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenShell>
  );
}

const markdownStyles = {
  body: { color: '#E1E9F5', fontSize: 15, lineHeight: 22 },
  heading1: { color: '#fff', fontSize: 20, fontWeight: '900' as const, marginVertical: 6 },
  heading2: { color: '#fff', fontSize: 18, fontWeight: '800' as const, marginVertical: 5 },
  heading3: { color: '#fff', fontSize: 16, fontWeight: '700' as const, marginVertical: 4 },
  link: { color: '#3D7CFF', textDecorationLine: 'underline' as const },
  blockquote: { color: '#9EB2D3', borderLeftWidth: 3, borderLeftColor: '#3D7CFF', paddingLeft: 10, marginVertical: 6 },
  code_inline: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#F472B6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 13 },
  code_block: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#E1E9F5', padding: 12, borderRadius: 10, fontSize: 13, fontFamily: 'monospace', marginVertical: 8 },
  fence: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#E1E9F5', padding: 12, borderRadius: 10, fontSize: 13, fontFamily: 'monospace', marginVertical: 8 },
  tableHeader: { backgroundColor: 'rgba(61,124,255,0.15)', borderColor: 'rgba(255,255,255,0.1)' },
  tableRow: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  hr: { backgroundColor: 'rgba(255,255,255,0.1)', height: 1, marginVertical: 10 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2, color: '#E1E9F5' },
  em: { fontStyle: 'italic' as const },
  strong: { fontWeight: '700' as const },
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 16, paddingBottom: 100 },
  msgWrapper: { maxWidth: '82%', gap: 4 },
  userWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  aiWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { padding: 14, paddingHorizontal: 18, borderRadius: 24 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff', fontWeight: '500' },
  aiText: { color: '#E1E9F5' },
  msgTime: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(61, 124, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(61, 124, 255, 0.2)' },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  emptySub: { color: colors.muted, textAlign: 'center', lineHeight: 22, fontSize: 15 },
  inputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 24, paddingHorizontal: 16 },
  inputCard: { padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 30, backgroundColor: 'rgba(11, 22, 42, 0.95)' },
  input: { flex: 1, color: '#fff', fontSize: 16, minHeight: 48, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  sendBtnDisabled: { opacity: 0.5, backgroundColor: colors.surfaceSoft },
  historyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  sidebarOverlay: { flex: 1, flexDirection: 'row-reverse' },
  sidebarBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sidebar: { width: '85%', maxWidth: 320, backgroundColor: colors.backgroundDeep, height: '100%', elevation: 20 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  sidebarTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  closeSidebar: { padding: 4 },
  sidebarContent: { flex: 1, padding: 16 },
  threadList: { gap: 8 },
  threadItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.02)' },
  threadItemActive: { backgroundColor: 'rgba(61, 124, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(61, 124, 255, 0.2)' },
  threadIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  threadInfo: { flex: 1, gap: 2 },
  threadName: { color: '#E1E9F5', fontSize: 15, fontWeight: '700' },
  activeText: { color: colors.primary },
  threadDate: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  noThreads: { color: colors.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
});
