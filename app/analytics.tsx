import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard } from '@/components';
import { colors } from '@/theme';
import { ScreenShell } from '@/screen-shell';
import { apiGet } from '@/api';
import { showError } from '@/toast';

export default function AnalyticsScreen() {
  const [metrics, setMetrics] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Record<string, number>>('/analytics/overview')
      .then((data: any) => setMetrics([
        ['Courses', data.courses ?? 0],
        ['Assignments', data.assignments ?? 0],
        ['Tests', data.tests ?? 0],
        ['Exams', data.exams ?? 0],
      ]))
      .catch((error) => showError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const maxVal = Math.max(...metrics.map(([, v]) => v), 1);

  return (
    <ScreenShell title="Analytics">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {metrics.map(([label, value]) => (
            <GlassCard key={label} style={styles.card}>
              <View style={[styles.statIcon, { backgroundColor: getAccent(label) }]}>
                <Ionicons name={getIcon(label)} size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.label}>{label}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.panelTitle}>Weekly Activity</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Hours</Text>
            </View>
          </View>
          <View style={styles.barChart}>
            {WEEK_DATA.map((item) => (
              <View key={item.day} style={styles.chartCol}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFillMain, 
                      { 
                        height: `${(item.val / 8) * 100}%`,
                        backgroundColor: item.val > 6 ? colors.success : colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.chartCard}>
          <Text style={styles.panelTitle}>Metric Distribution</Text>
          <View style={styles.chartContainer}>
            {metrics.map(([label, value]) => (
              <View key={label} style={styles.barWrapper}>
                <View style={styles.barLabelGroup}>
                  <Text style={styles.barLabel}>{label}</Text>
                  <Text style={styles.barValue}>{value}</Text>
                </View>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${(value / maxVal) * 100}%`,
                        backgroundColor: getAccent(label)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <Ionicons name="bulb-outline" size={24} color={colors.warning} />
            <Text style={styles.panelTitle}>Academic Insights</Text>
          </View>
          <Text style={styles.panelBody}>
            Live counts now come from your backend analytics endpoint. This section provides a real-time overview of your academic progress.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.panelFooter}>
            Trends and performance summaries will be added as more data becomes available.
          </Text>
        </GlassCard>
      </ScrollView>
    </ScreenShell>
  );
}

const WEEK_DATA = [
  { day: 'Mon', val: 4 },
  { day: 'Tue', val: 6 },
  { day: 'Wed', val: 5 },
  { day: 'Thu', val: 7.5 },
  { day: 'Fri', val: 3 },
  { day: 'Sat', val: 2 },
  { day: 'Sun', val: 1 },
];

function getIcon(label: string): keyof typeof Ionicons.glyphMap {
  if (label.includes('Course')) return 'book';
  if (label.includes('Assignment')) return 'document-text';
  if (label.includes('Test')) return 'flask';
  if (label.includes('Exam')) return 'school';
  return 'stats-chart';
}

function getAccent(label: string) {
  if (label.includes('Course')) return colors.primary;
  if (label.includes('Assignment')) return '#B14CFF';
  if (label.includes('Test')) return colors.warning;
  if (label.includes('Exam')) return colors.success;
  return colors.primary;
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48.2%', padding: 20, gap: 14, minHeight: 130, justifyContent: 'space-between' },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value: { color: '#fff', fontSize: 32, fontWeight: '900' },
  label: { color: '#AFC0DF', fontSize: 13, fontWeight: '700', marginTop: 2 },
  chartCard: { padding: 20, gap: 20 },
  chartContainer: { gap: 16 },
  barWrapper: { gap: 8 },
  barLabelGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { color: '#AFC0DF', fontSize: 13, fontWeight: '700' },
  barValue: { color: '#fff', fontSize: 13, fontWeight: '900' },
  barBackground: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  barChart: { flexDirection: 'row', height: 160, alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10 },
  chartCol: { alignItems: 'center', gap: 8, flex: 1 },
  barContainer: { flex: 1, width: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  barFillMain: { width: '100%', borderRadius: 12 },
  dayLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  panel: { padding: 20, gap: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  panelBody: { color: '#B2C3E1', lineHeight: 24, fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 4 },
  panelFooter: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
});
