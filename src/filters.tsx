import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components';

export function SortFilterBar({
  sort,
  setSort,
  order,
  setOrder,
  filters,
  setFilters,
}: {
  sort: string;
  setSort: (v: string) => void;
  order: 'asc' | 'desc';
  setOrder: (v: 'asc' | 'desc') => void;
  filters: string[];
  setFilters: (v: string[]) => void;
}) {
  const options = ['created_at', 'title', 'deadline_date', 'course_code'];
  return (
    <GlassCard style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => <Chip key={opt} label={opt} active={sort === opt} onPress={() => setSort(opt)} />)}
        <Chip label={order === 'asc' ? 'Ascending' : 'Descending'} active onPress={() => setOrder(order === 'asc' ? 'desc' : 'asc')} />
      </ScrollView>
      <View style={styles.filterRow}>
        {['all', 'academic', 'personal', 'urgent'].map((f) => <Chip key={f} label={f} active={filters.includes(f)} onPress={() => setFilters(f === 'all' ? [] : [f])} />)}
      </View>
    </GlassCard>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}><Text style={[styles.text, active && styles.textActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, padding: 12, gap: 10 },
  row: { gap: 8, paddingRight: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#132545', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  active: { backgroundColor: '#3D7CFF' },
  text: { color: '#B2C3E1', fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },
  textActive: { color: '#fff' },
});
