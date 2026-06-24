import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { CrudModal } from '@/crud-modal';
import { apiGetWithQuery } from '@/api';
import { createItem, deleteItem, updateItem } from '@/api-hooks';
import { showError } from '@/toast';
import { SortFilterBar } from '@/filters';

export default function TestsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<string[]>([]);

  const fields = useMemo(() => [
    { key: 'title', label: 'Title', placeholder: 'Midterm Test' },
    { key: 'date', label: 'Date', placeholder: '2026-07-01' },
    { key: 'time', label: 'Time', placeholder: '09:00' },
    { key: 'venue', label: 'Venue', placeholder: 'Hall B' },
    { key: 'notes', label: 'Notes', placeholder: 'Optional notes', multiline: true },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/tests', { page: nextPage, limit: 20, sortBy: sort, order, filters: filters.join(',') || undefined, search: search.trim() || undefined });
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
    <ScreenShell title="Tests">
    <GradientShell>
      <PrimaryButton title="Add Test" icon="add" onPress={openCreate} />
      <GlassCard style={styles.searchCard}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search tests..." placeholderTextColor="#7E92B9" style={styles.searchInput} onSubmitEditing={() => load(1, false)} />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      {loading ? <ActivityIndicator color="#fff" /> : null}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No tests found.</Text> : null}
        onEndReached={() => { if (hasMore && !loading && !refreshing) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.sub}>{item.date} • {item.time ?? 'TBD'}</Text>
            <Text style={styles.sub}>{item.venue ?? 'Venue not set'}</Text>
            <View style={styles.actions}>
              <Action icon="create-outline" label="Edit" onPress={() => openEdit(item)} />
              <Action icon="trash-outline" label="Delete" danger onPress={() => remove(item)} />
            </View>
          </GlassCard>
        )}
      />
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Test' : 'New Test'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
    </ScreenShell>
  );
}

function Action({ icon, label, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.action}><Ionicons name={icon} color={danger ? '#FF6B6B' : '#86A8FF'} size={16} /><Text style={[styles.actionText, danger && { color: '#FF6B6B' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 30, fontWeight: '900', padding: 14, paddingBottom: 10 },
  searchCard: { marginHorizontal: 14, padding: 12, marginBottom: 10 },
  searchInput: { color: '#fff', minHeight: 48 },
  list: { padding: 14, gap: 12 },
  card: { padding: 14, gap: 4 },
  name: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sub: { color: '#B2C3E1' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#86A8FF', fontWeight: '800', fontSize: 12 },
  empty: { color: '#A6B7D7', paddingHorizontal: 14 },
});
