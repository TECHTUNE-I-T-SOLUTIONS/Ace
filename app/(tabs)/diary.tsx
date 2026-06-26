import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell } from '../../src/components';
import { colors } from '../../src/theme';
import { CrudModal } from '../../src/crud-modal';
import { apiGet } from '../../src/api';
import { supabase } from '../../src/lib/supabase';
import { showError } from '../../src/toast';

export default function Diary() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    apiGet<any[]>('/diary')
      .then((data: any) => setEntries(data.data ?? data ?? []))
      .catch((error) => showError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const fields = useMemo(() => [
    { key: 'title', label: 'Title', placeholder: 'Diary entry title' },
    { key: 'content', label: 'Content', placeholder: 'Write your reflection...', multiline: true },
    { key: 'mood', label: 'Mood', options: ['happy', 'focused', 'stressed', 'neutral'] },
  ], []);

  const submit = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('No authenticated user');

    const payload = {
      user_id: userId,
      title: draft.title ?? '',
      content: draft.content ?? '',
      mood: draft.mood ?? 'neutral',
    };
    const { error } = await supabase.from('diary_entries').insert(payload);
    if (error) throw error;
    setMode(false);
    const res: any = await apiGet('/diary');
    setEntries((res.data ?? res ?? []) as any[]);
  };

  const totalWords = entries.reduce((sum, entry) => sum + Number(entry.word_count ?? entry.wordCount ?? 0), 0);

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.title}>Personal Diary</Text>
            <Ionicons name="journal" size={32} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={styles.stats}>
            <Stat label="Total" value={String(entries.length)} icon="heart" />
            <Stat label="This Month" value={String(entries.filter((entry) => new Date(entry.created_at ?? entry.createdAt).getMonth() === new Date().getMonth()).length)} icon="calendar" />
            <Stat label="Avg Words" value={entries.length ? String(Math.round(totalWords / entries.length)) : '0'} icon="happy" />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recent Reflections</Text>
          <Pressable onPress={() => setMode(true)} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addBtnText}>New Entry</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : null}
        
        {entries.length ? entries.map((entry) => (
          <GlassCard key={entry.id} style={styles.entry}>
            <View style={styles.entryTop}>
              <View style={styles.entryHeader}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
              </View>
              <Text style={styles.entryDate}>{new Date(entry.created_at ?? entry.createdAt).toLocaleDateString()}</Text>
            </View>
            
            <Text style={styles.entryBody} numberOfLines={3}>{entry.content}</Text>
            
            <View style={styles.entryBottom}>
              <View style={styles.wordBadge}>
                <Ionicons name="document-outline" size={12} color={colors.muted} />
                <Text style={styles.entryWords}>{entry.word_count ?? entry.wordCount ?? 0} words</Text>
              </View>
              <Pressable style={styles.readMoreBtn}>
                <Text style={styles.readMore}>Read details</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          </GlassCard>
        )) : <Text style={styles.empty}>Your diary is empty. Start writing your first entry!</Text>}
      </ScrollView>

      <Pressable onPress={() => setMode(true)} style={styles.fab}>
        <Ionicons name="create" size={26} color="#fff" />
      </Pressable>

      <CrudModal visible={mode} title="New Diary Entry" fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(false)} onSubmit={submit} />
    </GradientShell>
  );
}

function getMoodEmoji(mood: string) {
  switch (mood?.toLowerCase()) {
    case 'happy': return '😊';
    case 'focused': return '🧠';
    case 'stressed': return '😫';
    default: return '😐';
  }
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} color="#fff" size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  hero: { borderRadius: 32, padding: 24, backgroundColor: '#D61E7E' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  statIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  section: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61, 124, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  entry: { padding: 18, gap: 12 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  moodEmoji: { fontSize: 20 },
  entryTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 },
  entryDate: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  entryBody: { color: '#B1C1E0', lineHeight: 22, fontSize: 14 },
  entryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  wordBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryWords: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readMore: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  empty: { color: '#A6B7D7', textAlign: 'center', marginTop: 40, fontSize: 15, lineHeight: 22 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#D61E7E', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#D61E7E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
