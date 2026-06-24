import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { CrudModal } from '@/crud-modal';
import { createItem, deleteItem, updateItem, useCrudList } from '@/api-hooks';
import { SortFilterBar } from '@/filters';

export default function AttendanceScreen() {
  const { items, loading, refresh } = useCrudList<any>('/attendance', { sortBy: 'created_at', order: 'desc' });
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('course_id');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  const fields = useMemo(() => [
    { key: 'course_id', label: 'Course ID', placeholder: 'course uuid' },
    { key: 'classes_held', label: 'Classes Held', placeholder: '12' },
    { key: 'classes_attended', label: 'Classes Attended', placeholder: '11' },
  ], []);
  const open = (item?: any) => { setSelected(item ?? null); setDraft({ course_id: item?.course_id ?? '', classes_held: item?.classes_held?.toString() ?? '', classes_attended: item?.classes_attended?.toString() ?? '' }); setMode(item ? 'edit' : 'create'); };
  const submit = async () => { if (mode === 'create') await createItem('/attendance', draft); if (mode === 'edit' && selected) await updateItem(`/attendance/${selected.id}`, draft); setMode(null); await refresh(); };
  return (
    <ScreenShell title="Attendance">
    <GradientShell>
      <View style={styles.header}><PrimaryButton title="New Record" icon="add" onPress={() => open()} /></View>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      {loading ? <ActivityIndicator color="#fff" /> : null}
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} renderItem={({ item }) => <GlassCard style={styles.card}><Text style={styles.name}>{item.course_id}</Text><Text style={styles.sub}>{item.classes_attended}/{item.classes_held} classes</Text><Text style={styles.percent}>{item.attendance_percentage ?? 0}%</Text><View style={styles.actions}><Pressable onPress={() => open(item)}><Text style={styles.action}>Edit</Text></Pressable><Pressable onPress={async () => { await deleteItem(`/attendance/${item.id}`); await refresh(); }}><Text style={[styles.action, styles.danger]}>Delete</Text></Pressable></View></GlassCard>} />
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Attendance' : 'New Attendance'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
    </ScreenShell>
  );
}
const styles = StyleSheet.create({ header:{padding:14,gap:12}, title:{color:'#fff',fontSize:30,fontWeight:'900'}, list:{padding:14,gap:12}, card:{padding:14,gap:8}, name:{color:'#fff',fontSize:18,fontWeight:'900'}, sub:{color:'#B2C3E1'}, percent:{color:'#4C86FF',fontWeight:'900'}, actions:{flexDirection:'row',gap:16}, action:{color:'#86A8FF',fontWeight:'800'}, danger:{color:'#FF6B6B'} });
