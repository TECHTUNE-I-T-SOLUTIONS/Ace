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

export default function TestsScreen() {
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
    { key: 'title', label: 'Test Title', placeholder: 'Midterm Test', step: 1 },
    { key: 'date', label: 'Test Date', fieldType: 'date', step: 1 },
    { key: 'time', label: 'Test Time', fieldType: 'time', step: 1 },
    { key: 'venue', label: 'Venue', placeholder: 'Lecture Hall B', step: 2 },
    { key: 'notes', label: 'Test Notes', placeholder: 'Optional details...', multiline: true, step: 2 },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/tests', { page: nextPage, limit: 20, sortBy: sort, order, filters: filters.join(',') || undefined });
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { setSelected(null); setDraft({ title: '', date: '', time: '', venue: '', notes: '' }); setMode('create'); };
  const openEdit = (item: any) => { setSelected(item); setDraft({ title: item.title ?? '', date: item.date ?? '', time: item.time ?? '', venue: item.venue ?? '', notes: item.notes ?? '' }); setMode('edit'); };
  const submit = async () => { const payload = { ...draft }; if (mode === 'create') await createItem('/tests', payload); if (mode === 'edit' && selected) await updateItem(`/tests/${selected.id}`, payload); setMode(null); await load(1, false); };
  const remove = async (item: any) => { await deleteItem(`/tests/${item.id}`); await load(1, false); };

  return (
    <ScreenShell title="Assessments">
      <View style={styles.header}>
        <PrimaryButton title="Add New Test" icon="add" onPress={openCreate} />
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
          ListEmptyComponent={<Text style={styles.empty}>No assessments found.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.testIcon}>
                  <Ionicons name="flask" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.sub}>{item.date} • {item.time ?? 'TBD'}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <Text style={styles.infoText}>{item.venue || 'TBD'}</Text>
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
        title={mode === 'edit' ? 'Edit Test' : 'Add New Test'} 
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
  card: { padding: 20, gap: 14, borderRadius: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  testIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoText: { color: '#E1E9F5', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { padding: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
