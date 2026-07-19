import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard, GradientShell, PrimaryButton } from '../../src/components';
import { colors } from '../../src/theme';
import { CrudModal } from '../../src/crud-modal';
import { apiGet, apiGetWithQuery } from '../../src/api';
import { createItem, deleteItem, updateItem } from '../../src/api-hooks';
import { showError } from '../../src/toast';
import { formatDate } from '../../src/utils/date-utils';

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
        apiGet<any>('/tasks'),
        apiGet('/analytics/overview'),
      ]);
      const allTasks = (tasks as any).data ?? tasks ?? [];
      setItems(allTasks);
      setAnalytics(overview);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

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
  
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  return (
    <GradientShell>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Daily Tasks</Text>
          <PrimaryButton title="Add New" icon="add" onPress={() => open()} variant="light" />
        </View>
        <View style={styles.counterRow}>
          <Counter label="Pending" value={String(analytics?.tasks ?? pending)} icon="time-outline" color={colors.warning} />
          <Counter label="Done" value={String(completed)} icon="checkmark-circle-outline" color={colors.success} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'academic', 'personal', 'urgent'] as const).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : null}
      
      <FlatList
        contentContainerStyle={styles.list}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#fff" />}
        ListEmptyComponent={<Text style={styles.empty}>No tasks found in this category.</Text>}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push({ pathname: '/details', params: { type: 'task', id: item.id } })}
            style={({ pressed }) => [styles.taskCard, item.status === 'done' && styles.taskCardDone, pressed && { opacity: 0.8 }]}
          >
            <GlassCard style={[styles.taskCard, item.status === 'done' && styles.taskCardDone]}>
              <View style={styles.taskMain}>
                <Pressable 
                  onPress={async (e) => {
                    e.stopPropagation();
                    const nextStatus = item.status === 'done' ? 'todo' : 'done';
                    await updateItem(`/tasks/${item.id}`, { status: nextStatus });
                    await load(true);
                  }}
                  style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}
                >
                  {item.status === 'done' ? <Ionicons name="checkmark" color="#fff" size={14} /> : null}
                </Pressable>
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, item.status === 'done' && styles.done]}>{item.title}</Text>
                  {item.description ? <Text style={styles.taskSub} numberOfLines={2}>{item.description}</Text> : null}
                  
                  <View style={styles.taskMetaRow}>
                    <View style={[styles.priorityTag, getPriorityStyle(item.priority)]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                      <Text style={styles.metaText}>{formatDate(item.due)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.taskActions}>
                  <Pressable onPress={(e) => { e.stopPropagation(); open(item); }} style={styles.actionIcon}><Ionicons name="pencil-outline" size={18} color={colors.primary} /></Pressable>
                  <Pressable onPress={(e) => { e.stopPropagation(); remove(item); }} style={styles.actionIcon}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        )}
      />
      
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Task' : 'New Task'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
  );
}

function Counter({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <GlassCard style={styles.counter}>
      <View style={[styles.counterIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.counterValue}>{value}</Text>
        <Text style={styles.counterLabel}>{label}</Text>
      </View>
    </GlassCard>
  );
}

function getPriorityStyle(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' };
    case 'medium': return { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' };
    default: return { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' };
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return colors.danger;
    case 'medium': return colors.warning;
    default: return colors.success;
  }
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  counterRow: { flexDirection: 'row', gap: 10 },
  counter: { flex: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  counterValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  counterLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterPill: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  filterActive: { backgroundColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  taskCard: { padding: 16 },
  taskCardDone: { opacity: 0.6 },
  taskMain: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxDone: { borderColor: colors.success, backgroundColor: colors.success },
  taskTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  taskSub: { color: '#9EB2D3', marginTop: 4, fontSize: 13, lineHeight: 18 },
  taskMetaRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  taskActions: { gap: 12 },
  actionIcon: { padding: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, fontSize: 15 },
});