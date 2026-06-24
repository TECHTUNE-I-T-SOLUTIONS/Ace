import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell } from '@/components';
import { CrudModal } from '@/crud-modal';
import { apiGet } from '@/api';
import { supabase } from '@/lib/supabase';
import { showError } from '@/toast';

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
      word_count: draft.content ? draft.content.trim().split(/\s+/).filter(Boolean).length : 0,
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
          <Text style={styles.title}>Personal Diary</Text>
          <View style={styles.stats}>
            <Stat label="Total Entries" value={String(entries.length)} icon="heart-outline" />
            <Stat label="This Month" value={String(entries.filter((entry) => new Date(entry.created_at ?? entry.createdAt).getMonth() === new Date().getMonth()).length)} icon="calendar-outline" />
            <Stat label="Avg Words" value={entries.length ? String(Math.round(totalWords / entries.length)) : '0'} icon="happy-outline" />
          </View>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recent Entries</Text>
          <Pressable onPress={() => setMode(true)}><Text style={styles.sectionLight}>+ New Entry</Text></Pressable>
        </View>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {entries.length ? entries.map((entry) => (
          <GlassCard key={entry.id} style={styles.entry}>
            <View style={styles.entryTop}><Text style={styles.entryTitle}>{entry.title}</Text><Text style={styles.entryDate}>{new Date(entry.created_at ?? entry.createdAt).toLocaleDateString()}</Text></View>
            <Text style={styles.entryMeta}>{entry.mood ?? 'neutral'}</Text>
            <Text style={styles.entryBody} numberOfLines={4}>{entry.content}</Text>
            <View style={styles.entryBottom}><Text style={styles.entryWords}>{entry.word_count ?? entry.wordCount ?? 0} words</Text><Pressable><Text style={styles.readMore}>Read more →</Text></Pressable></View>
          </GlassCard>
        )) : <Text style={styles.empty}>No diary entries yet.</Text>}
      </ScrollView>
      <Pressable onPress={() => setMode(true)} style={styles.fab}><Ionicons name="add" size={30} color="#fff" /></Pressable>
      <CrudModal visible={mode} title="New Diary Entry" fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(false)} onSubmit={submit} />
    </GradientShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return <GlassCard style={styles.stat}><View style={styles.statIcon}><Ionicons name={icon} color="#fff" size={20} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></GlassCard>;
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingTop: 20, paddingBottom: 110, gap: 14 },
  hero: { borderRadius: 28, padding: 16, backgroundColor: '#D61E7E' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, padding: 12, alignItems: 'center', gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#F4E7FF', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionLight: { color: '#A6B7D7', fontSize: 12, fontWeight: '700' },
  entry: { padding: 14, gap: 8 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  entryTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800' },
  entryDate: { color: '#9CB0D0', fontSize: 12, fontWeight: '700' },
  entryMeta: { color: '#7DA2FF', fontSize: 12, fontWeight: '700' },
  entryBody: { color: '#B1C1E0', lineHeight: 21, fontSize: 13 },
  entryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryWords: { color: '#8FA4C8', fontSize: 12, fontWeight: '700' },
  readMore: { color: '#6EA0FF', fontWeight: '800' },
  empty: { color: '#A6B7D7' },
  fab: { position: 'absolute', right: 16, bottom: 96, width: 54, height: 54, borderRadius: 27, backgroundColor: '#D92DB5', alignItems: 'center', justifyContent: 'center' },
});
