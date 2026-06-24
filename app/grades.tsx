import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { CrudModal } from '@/crud-modal';
import { createItem, deleteItem, updateItem, useCrudList } from '@/api-hooks';
import { SortFilterBar } from '@/filters';

export default function GradesScreen() {
  const { items, loading, refresh } = useCrudList<any>('/grades');
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('semester');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  const fields = useMemo(() => [{ key: 'course_id', label: 'Course ID' }, { key: 'semester', label: 'Semester' }, { key: 'credit_units', label: 'Credit Units' }, { key: 'grade_point', label: 'Grade Point' }], []);
  const open = (item?: any) => { setSelected(item ?? null); setDraft({ course_id: item?.course_id ?? '', semester: item?.semester ?? '', credit_units: item?.credit_units?.toString() ?? '', grade_point: item?.grade_point?.toString() ?? '' }); setMode(item ? 'edit' : 'create'); };
  const submit = async () => { if (mode === 'create') await createItem('/grades', draft); if (mode === 'edit' && selected) await updateItem(`/grades/${selected.id}`, draft); setMode(null); await refresh(); };
  return (<ScreenShell title="Grades"><GradientShell><PrimaryButton title="New Grade" icon="add" onPress={() => open()} /><SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />{loading ? <ActivityIndicator color="#fff" /> : null}<FlatList data={items} keyExtractor={(i)=>i.id} contentContainerStyle={styles.list} renderItem={({item})=><GlassCard style={styles.card}><Text style={styles.name}>{item.course_id}</Text><Text style={styles.sub}>{item.semester}</Text><Text style={styles.percent}>{item.grade_point}</Text><Text style={styles.actions}><Pressable onPress={() => open(item)}><Text style={styles.action}>Edit</Text></Pressable> <Pressable onPress={async()=>{await deleteItem(`/grades/${item.id}`); await refresh();}}><Text style={[styles.action, styles.danger]}>Delete</Text></Pressable></Text></GlassCard>} /><CrudModal visible={!!mode} title={mode==='edit'?'Edit Grade':'New Grade'} fields={fields} values={draft} onChange={setDraft} onClose={()=>setMode(null)} onSubmit={submit} /></GradientShell></ScreenShell>);
}
const styles = StyleSheet.create({ title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, list:{padding:14,gap:12}, card:{padding:14,gap:6}, name:{color:'#fff',fontSize:18,fontWeight:'900'}, sub:{color:'#B2C3E1'}, percent:{color:'#4C86FF',fontWeight:'900'}, actions:{}, action:{color:'#86A8FF',fontWeight:'800'}, danger:{color:'#FF6B6B'} });
