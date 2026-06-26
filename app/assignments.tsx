import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal } from '../src/crud-modal';
import { apiGetWithQuery } from '../src/api';
import { createItem, deleteItem, updateItem } from '../src/api-hooks';
import { showError } from '../src/toast';
import { SortFilterBar } from '../src/filters';

export default function AssignmentsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('deadline_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<string[]>([]);

  const fields = useMemo<any[]>(() => [
    { key: 'title', label: 'Assignment Title', placeholder: 'React Native Project', step: 1 },
    { key: 'description', label: 'Detailed Description', placeholder: 'Explain the requirements...', multiline: true, step: 1 },
    { key: 'priority', label: 'Priority Level', options: ['Low', 'Medium', 'High'], step: 2 },
    { key: 'deadline_date', label: 'Due Date', fieldType: 'date', placeholder: 'Pick date', step: 2 },
    { key: 'deadline_time', label: 'Due Time', fieldType: 'time', placeholder: 'Pick time', step: 2 },
    { key: 'status', label: 'Current Status', options: ['pending', 'completed'], step: 2 },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/assignments', {
        page: nextPage,
        limit: 20,
        sortBy: sort,
        order,
        filters: filters.join(',') || undefined,
        search: search.trim() || undefined,
      });
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { 
    setSelected(null); 
    setDraft({ title: '', description: '', priority: 'Medium', deadline_date: '', deadline_time: '', status: 'pending' }); 
    setMode('create'); 
  };
  const openEdit = (item: any) => { 
    setSelected(item); 
    setDraft({ 
      title: item.title ?? '', 
      description: item.description ?? '', 
      priority: item.priority ?? 'Medium', 
      deadline_date: item.deadline_date ?? item.deadlineDate ?? '', 
      deadline_time: item.deadline_time ?? item.deadlineTime ?? '', 
      status: item.status ?? 'pending' 
    }); 
    setMode('edit'); 
  };
  const submit = async () => { const payload = { ...draft }; if (mode === 'create') await createItem('/assignments', payload); if (mode === 'edit' && selected) await updateItem(`/assignments/${selected.id}`, payload); setMode(null); await load(1, false); };
  const remove = async (item: any) => { await deleteItem(`/assignments/${item.id}`); await load(1, false); };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return { color: colors.danger, bg: 'rgba(239, 68, 68, 0.1)' };
      case 'medium': return { color: colors.warning, bg: 'rgba(245, 158, 11, 0.1)' };
      default: return { color: colors.success, bg: 'rgba(34, 197, 94, 0.1)' };
    }
  };

  return (
    <ScreenShell title="Assignments">
      <View style={styles.header}>
        <PrimaryButton title="New Assignment" icon="add" onPress={openCreate} />
      </View>
      <GlassCard style={styles.searchCard}>
        <Ionicons name="search-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput 
          value={search} 
          onChangeText={setSearch} 
          placeholder="Search assignments..." 
          placeholderTextColor="#7E92B9" 
          style={styles.searchInput} 
          onSubmitEditing={() => load(1, false)} 
        />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
        ListEmptyComponent={loading ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : <Text style={styles.empty}>No assignments found.</Text>}
        onEndReached={() => { if (hasMore && !loading && !refreshing) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => {
          const pStyle = getPriorityStyle(item.priority);
          return (
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                  <Text style={[styles.priorityText, { color: pStyle.color }]}>{item.priority?.toUpperCase() ?? 'MEDIUM'}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status === 'pending' ? 'Pending' : item.status === 'completed' ? 'Completed' : 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.title}</Text>
                {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
                <View style={styles.dueDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                  <Text style={styles.sub}>Due: {item.deadline_date ?? 'TBD'} at {item.deadline_time ?? '00:00'}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={() => openEdit(item)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => remove(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </GlassCard>
          );
        }}
      />
      <CrudModal 
        visible={!!mode} 
        title={mode === 'edit' ? 'Edit Assignment' : 'New Assignment'} 
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
  header: { padding: 16, paddingBottom: 10, marginBottom: 8 },
  searchCard: { marginHorizontal: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', minHeight: 52, marginBottom: 24 },
  searchInput: { color: '#fff', flex: 1, fontSize: 15 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { padding: 20, gap: 14, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#D8E6FF', fontWeight: '800', fontSize: 11 },
  cardContent: { gap: 6 },
  name: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  desc: { color: '#9EB2D3', fontSize: 14, lineHeight: 20 },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sub: { color: '#8DA3C7', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61, 124, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#A6B7D7', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
