import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal, ModalField } from '../src/crud-modal';
import { apiGetWithQuery } from '../src/api';
import { createItem, deleteItem, updateItem } from '../src/api-hooks';
import { showError } from '../src/toast';
import { SortFilterBar } from '../src/filters';

export default function ExamsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<string[]>([]);

  const fields: ModalField[] = useMemo(() => [
    { key: 'title', label: 'Exam Title', placeholder: 'Final Examination', step: 1 },
    { key: 'date', label: 'Exam Date', fieldType: 'date', step: 1 },
    { key: 'time', label: 'Exam Time', fieldType: 'time', step: 1 },
    { key: 'venue', label: 'Venue', placeholder: 'Exam Hall A', step: 2 },
    { key: 'seat_info', label: 'Seat Number/Info', placeholder: 'Row 2 Seat 14', step: 2 },
    { key: 'notes', label: 'Personal Notes', placeholder: 'Additional info...', multiline: true, step: 2 },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/exams', { page: nextPage, limit: 20, sortBy: sort, order, filters: filters.join(',') || undefined });
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { setSelected(null); setDraft({ title: '', date: '', time: '', venue: '', seat_info: '', notes: '' }); setMode('create'); };
  const openEdit = (item: any) => { setSelected(item); setDraft({ title: item.title ?? '', date: item.date ?? '', time: item.time ?? '', venue: item.venue ?? '', seat_info: item.seat_info ?? item.seatInfo ?? '', notes: item.notes ?? '' }); setMode('edit'); };
  const submit = async () => { const payload = { ...draft }; if (mode === 'create') await createItem('/exams', payload); if (mode === 'edit' && selected) await updateItem(`/exams/${selected.id}`, payload); setMode(null); await load(1, false); };
  const remove = async (item: any) => { await deleteItem(`/exams/${item.id}`); await load(1, false); };

  return (
    <ScreenShell title="Examinations">
      <View style={styles.header}>
        <PrimaryButton title="Add New Exam" icon="add" onPress={openCreate} />
      </View>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      
      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
          ListEmptyComponent={<Text style={styles.empty}>No examinations scheduled yet.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.examIcon}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.sub}>{item.date} at {item.time ?? 'TBD'}</Text>
                </View>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.infoText}>{item.venue || 'TBD'}</Text>
                </View>
                {item.seat_info ? (
                  <View style={styles.infoItem}>
                    <Ionicons name="bookmark-outline" size={14} color={colors.muted} />
                    <Text style={styles.infoText}>{item.seat_info}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.actions}>
                <Pressable onPress={() => openEdit(item)} style={styles.actionBtn}><Ionicons name="pencil" size={18} color={colors.primary} /></Pressable>
                <Pressable onPress={() => remove(item)} style={styles.actionBtn}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
              </View>
            </GlassCard>
          )}
        />
      )}
      <CrudModal 
        visible={!!mode} 
        title={mode === 'edit' ? 'Edit Exam' : 'Add New Exam'} 
        fields={fields} 
        values={draft} 
        onChange={setDraft} 
        onClose={() => setMode(null)} 
        onSubmit={submit}
        totalSteps={2}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 10 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { padding: 20, gap: 16, borderRadius: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  examIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(61, 124, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: '#E1E9F5', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { padding: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
