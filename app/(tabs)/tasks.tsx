import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell, PrimaryButton } from '@/components';
import { CrudModal } from '@/crud-modal';
import { apiGet, apiGetWithQuery } from '@/api';
import { createItem, deleteItem, updateItem } from '@/api-hooks';
import { showError } from '@/toast';

export default function Tasks() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'academic' | 'personal' | 'urgent'>('all');
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const fields = useMemo<any[]>(() => [
    { key: 'title', label: 'Title', placeholder: 'Task title' },
    { key: 'description', label: 'Description', placeholder: 'Short description', multiline: true },
    { key: 'category', label: 'Category', options: ['academic', 'personal', 'urgent'] },
    { key: 'priority', label: 'Priority', options: ['low', 'medium', 'high'] },
    { key: 'status', label: 'Status', options: ['todo', 'doing', 'done'] },
    { key: 'due', label: 'Due Date', fieldType: 'date', placeholder: 'Pick a date' },
  ], []);

  const load = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      const [tasks, overview] = await Promise.all([
        apiGetWithQuery('/tasks', { filters: filter === 'all' ? undefined : filter }),
        apiGet('/analytics/overview'),
      ]);
      setItems((tasks as any).data ?? tasks ?? []);
      setAnalytics(overview);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const open = (item?: any) => {
    setSelected(item ?? null);
    setDraft({
      title: item?.title ?? '',
      description: item?.description ?? item?.subtitle ?? '',
      category: item?.category ?? 'academic',
      priority: item?.priority ?? 'medium',
      status: item?.status ?? 'todo',
      due: item?.due ?? item?.deadline ?? '',
    });
    setMode(item ? 'edit' : 'create');
  };

  const submit = async () => {
    const payload = { ...draft };
    if (mode === 'create') await createItem('/tasks', payload);
    if (mode === 'edit' && selected) await updateItem(`/tasks/${selected.id}`, payload);
    setMode(null);
    await load(true);
  };

  const remove = async (item: any) => { await deleteItem(`/tasks/${item.id}`); await load(true); };

  const pending = useMemo(() => items.filter((item) => item.status !== 'done').length, [items]);
  const completed = useMemo(() => items.filter((item) => item.status === 'done').length, [items]);

  return (
    <GradientShell>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.counterRow}>
          <Counter label="Pending" value={String(analytics?.tasks ?? pending)} />
          <Counter label="Completed" value={String(completed)} />
        </View>
      </View>
      <View style={styles.filterRow}>
        {(['all', 'academic', 'personal', 'urgent'] as const).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actionsRow}>
        <PrimaryButton title="Add Task" icon="add" onPress={() => open()} />
      </View>
      {loading ? <ActivityIndicator color="#fff" /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#fff" />}
        ListEmptyComponent={<Text style={styles.empty}>No tasks yet.</Text>}
        renderItem={({ item }) => (
          <GlassCard style={styles.taskCard}>
            <View style={styles.taskTop}>
              <View style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}>
                {item.status === 'done' ? <Ionicons name="checkmark" color="#fff" size={16} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, item.status === 'done' && styles.done]}>{item.title}</Text>
                <Text style={styles.taskSub}>{item.description ?? item.subtitle ?? 'No description'}</Text>
                <View style={styles.taskMetaRow}>
                  <Text style={[styles.tag, item.priority === 'high' ? styles.high : item.priority === 'medium' ? styles.medium : styles.personal]}>{item.priority}</Text>
                  <Text style={styles.metaText}>{item.category ?? 'academic'}</Text>
                  <Text style={styles.metaText}>{item.due ?? item.deadline ?? 'No deadline'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => open(item)}><Text style={styles.action}>Edit</Text></Pressable>
              <Pressable onPress={() => remove(item)}><Text style={[styles.action, styles.danger]}>Delete</Text></Pressable>
            </View>
          </GlassCard>
        )}
      />
      <Pressable onPress={() => open()} style={styles.fab}><Ionicons name="add" size={30} color="#fff" /></Pressable>
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Task' : 'New Task'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return <GlassCard style={styles.counter}><Text style={styles.counterValue}>{value}</Text><Text style={styles.counterLabel}>{label}</Text></GlassCard>;
}

const styles = StyleSheet.create({
  header: { padding: 14, paddingTop: 20, paddingBottom: 0 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginBottom: 12 },
  counterRow: { flexDirection: 'row', gap: 12 },
  counter: { flex: 1, padding: 16, minHeight: 84 },
  counterValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  counterLabel: { color: '#B6C6E6', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginTop: 14 },
  filterPill: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18263F' },
  filterActive: { backgroundColor: '#3D7CFF' },
  filterText: { color: '#B7C7E7', fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  actionsRow: { paddingHorizontal: 14, marginTop: 14 },
  list: { padding: 14, gap: 12, paddingBottom: 110 },
  taskCard: { padding: 14, gap: 10 },
  taskTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#7F93B5', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  checkboxDone: { borderColor: '#20C979', backgroundColor: '#20C979' },
  taskTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  taskSub: { color: '#9EB2D3', marginTop: 4, fontSize: 12 },
  taskMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: '800', textTransform: 'lowercase' },
  high: { color: '#FF6B6B', borderWidth: 1, borderColor: 'rgba(255,107,107,0.5)' },
  medium: { color: '#F5B244', borderWidth: 1, borderColor: 'rgba(245,178,68,0.5)' },
  personal: { color: '#61A5FF', borderWidth: 1, borderColor: 'rgba(97,165,255,0.5)' },
  metaText: { color: '#8DA3C7', fontSize: 12, fontWeight: '700' },
  done: { textDecorationLine: 'line-through', color: '#7790B5' },
  empty: { color: '#A6B7D7', fontSize: 13, paddingHorizontal: 14 },
  action: { color: '#86A8FF', fontWeight: '800' },
  danger: { color: '#FF6B6B' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 96, width: 54, height: 54, borderRadius: 27, backgroundColor: '#3D7CFF', alignItems: 'center', justifyContent: 'center' },
});
