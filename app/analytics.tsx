import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { apiGet } from '@/api';
import { showError } from '@/toast';

export default function AnalyticsScreen() {
  const [metrics, setMetrics] = useState<[string, string][]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet<Record<string, number>>('/analytics/overview')
      .then((data: any) => setMetrics([
        ['Courses', String(data.courses ?? 0)],
        ['Assignments', String(data.assignments ?? 0)],
        ['Tests', String(data.tests ?? 0)],
        ['Exams', String(data.exams ?? 0)],
      ]))
      .catch((error) => showError(error.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <ScreenShell title="Analytics">
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        <View style={styles.grid}>
          {metrics.map(([label, value]) => (
            <GlassCard key={label} style={styles.card}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label}>{label}</Text>
            </GlassCard>
          ))}
        </View>
        <GlassCard style={styles.panel}>
          <Text style={styles.panelTitle}>Academic Insights</Text>
          <Text style={styles.panelBody}>Live counts now come from your backend analytics endpoint, so this section can grow into charts, trends, and performance summaries without changing the data source.</Text>
        </GlassCard>
      </ScrollView>
    </GradientShell>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 14, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48.5%', padding: 16, minHeight: 96 },
  value: { color: '#fff', fontSize: 28, fontWeight: '900' },
  label: { color: '#AFC0DF', fontSize: 12, fontWeight: '700' },
  panel: { padding: 16, gap: 8 },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  panelBody: { color: '#B2C3E1', lineHeight: 22 },
});
