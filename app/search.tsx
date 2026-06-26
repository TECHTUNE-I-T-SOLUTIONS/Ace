import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { apiGet } from '../src/api';
import { showError } from '../src/toast';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sectionRoutes: Record<string, string> = {
    courses: '/courses',
    notes: '/notes',
    assignments: '/assignments',
    exams: '/exams',
    tests: '/tests',
    tasks: '/(tabs)/tasks',
    diary: '/(tabs)/diary',
  };

  const navigateToResult = (section: string, item: any) => {
    const route = sectionRoutes[section];
    if (route) {
      router.push(route);
    }
  };

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
                  <Pressable key={item.id} onPress={() => navigateToResult(section, item)} style={styles.item}>
                    <View style={styles.itemRow}>
                      <Text style={styles.itemTitle}>{item.title ?? item.course_title ?? item.courseCode ?? 'Result'}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </View>
                    <Text style={styles.itemSub}>{item.content ?? item.description ?? item.course_code ?? ''}</Text>
                  </Pressable>
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
  item: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(148,175,230,0.12)' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#fff', fontWeight: '800', flex: 1 },
  itemSub: { color: '#9EB2D3', fontSize: 12, marginTop: 2 },
});
