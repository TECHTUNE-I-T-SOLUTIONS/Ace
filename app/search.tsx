import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GradientShell, GlassCard } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { apiGet } from '@/api';
import { showError } from '@/toast';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async (value: string) => {
    setQuery(value);
    if (!value.trim()) return setResults(null);
    setLoading(true);
    try {
      const data: any = await apiGet(`/search?q=${encodeURIComponent(value)}`);
      setResults(data.data ?? data);
    } catch (error: any) {
      showError(error.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Search">
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard style={styles.searchCard}>
          <TextInput value={query} onChangeText={run} placeholder="Search courses, notes, tasks..." placeholderTextColor="#7E92B9" style={styles.searchInput} />
        </GlassCard>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {results ? (
          <View style={{ gap: 12 }}>
            {Object.entries(results).map(([section, items]: any) => (
              <GlassCard key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{section}</Text>
                {(items as any[]).slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.item}>
                    <Text style={styles.itemTitle}>{item.title ?? item.course_title ?? item.courseCode ?? 'Result'}</Text>
                    <Text style={styles.itemSub}>{item.content ?? item.description ?? item.course_code ?? ''}</Text>
                  </View>
                ))}
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard style={styles.empty}>
            <Text style={styles.emptyTitle}>Search across your academic life</Text>
            <Text style={styles.emptyBody}>Find notes, courses, assignments, exams, tasks, and diary entries from one place.</Text>
          </GlassCard>
        )}
      </ScrollView>
    </GradientShell>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 14, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  searchCard: { padding: 12 },
  searchInput: { minHeight: 48, color: '#fff' },
  empty: { padding: 16, gap: 8 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  emptyBody: { color: '#B2C3E1', lineHeight: 22 },
  section: { padding: 14, gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },
  item: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(148,175,230,0.12)' },
  itemTitle: { color: '#fff', fontWeight: '800' },
  itemSub: { color: '#9EB2D3', fontSize: 12, marginTop: 2 },
});
