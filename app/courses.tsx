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

export default function CoursesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  const [queryError, setQueryError] = useState('');

  const fields = useMemo(() => [
    { key: 'course_code', label: 'Course Code', placeholder: 'CSC 301' },
    { key: 'course_title', label: 'Course Title', placeholder: 'Database Systems' },
    { key: 'lecturer_name', label: 'Lecturer Name', placeholder: 'Dr. Smith' },
    { key: 'venue', label: 'Venue', placeholder: 'LT 101' },
    { key: 'day_of_week', label: 'Day of Week', placeholder: 'Monday' },
    { key: 'start_time', label: 'Start Time', placeholder: '09:00' },
    { key: 'end_time', label: 'End Time', placeholder: '11:00' },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/courses', {
        page: nextPage,
        limit: 20,
        sortBy: sort,
        order,
        filters: filters.join(',') || undefined,
        search: search.trim() || undefined,
      });
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
      setHasMore(Boolean(res.count ? rows.length >= 20 : rows.length === 20));
      setPage(nextPage);
      setQueryError('');
    } catch (error: any) {
      setQueryError(error.message ?? 'Failed to load courses');
      showError(error.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { setSelected(null); setDraft({ course_code: '', course_title: '', lecturer_name: '', venue: '', day_of_week: '', start_time: '', end_time: '' }); setMode('create'); };
  const openEdit = (item: any) => { setSelected(item); setDraft({ course_code: item.course_code ?? item.courseCode ?? '', course_title: item.course_title ?? item.courseTitle ?? '', lecturer_name: item.lecturer_name ?? item.lecturerName ?? '', venue: item.venue ?? '', day_of_week: item.day_of_week ?? item.dayOfWeek ?? '', start_time: item.start_time ?? item.startTime ?? '', end_time: item.end_time ?? item.endTime ?? '' }); setMode('edit'); };
  const submit = async () => {
    const payload = { ...draft };
    if (mode === 'create') await createItem('/courses', payload);
    if (mode === 'edit' && selected) await updateItem(`/courses/${selected.id}`, payload);
    setMode(null);
    await load(1, false);
  };
  const remove = async (item: any) => { await deleteItem(`/courses/${item.id}`); await load(1, false); };

  return (
    <ScreenShell title="Courses">
    <GradientShell>
      <View style={styles.header}>
        <PrimaryButton title="Add Course" icon="add" onPress={openCreate} />
      </View>
      <GlassCard style={styles.searchCard}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search courses..." placeholderTextColor="#7E92B9" style={styles.searchInput} onSubmitEditing={() => load(1, false)} />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      {loading ? <ActivityIndicator color="#fff" /> : null}
      {queryError ? <Text style={styles.error}>{queryError}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No courses found.</Text> : null}
        onEndReached={() => { if (hasMore && !loading && !refreshing) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <View style={styles.row}><Text style={styles.code}>{item.course_code ?? item.courseCode}</Text><Text style={styles.badge}>{item.day_of_week ?? item.dayOfWeek ?? 'TBD'}</Text></View>
            <Text style={styles.name}>{item.course_title ?? item.courseTitle}</Text>
            <Text style={styles.sub}>{item.lecturer_name ?? item.lecturerName ?? 'Lecturer not set'}</Text>
            <Text style={styles.meta}>{item.venue ?? 'Venue not set'}</Text>
            <View style={styles.actions}>
              <Action icon="create-outline" label="Edit" onPress={() => openEdit(item)} />
              <Action icon="trash-outline" label="Delete" danger onPress={() => remove(item)} />
            </View>
          </GlassCard>
        )}
      />
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Course' : 'New Course'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
    </ScreenShell>
  );
}

function Action({ icon, label, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.action}><Ionicons name={icon} color={danger ? '#FF6B6B' : '#86A8FF'} size={16} /><Text style={[styles.actionText, danger && { color: '#FF6B6B' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  header: { padding: 14, gap: 12 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  searchCard: { marginHorizontal: 14, padding: 12 },
  searchInput: { color: '#fff', minHeight: 48 },
  list: { padding: 14, gap: 12, paddingBottom: 20 },
  card: { padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  code: { color: '#7BA2FF', fontWeight: '900' },
  badge: { color: '#D8E6FF', fontWeight: '700' },
  name: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sub: { color: '#B2C3E1', fontSize: 13 },
  meta: { color: '#8DA3C7', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#86A8FF', fontWeight: '800', fontSize: 12 },
  empty: { color: '#A6B7D7', paddingHorizontal: 14 },
  error: { color: '#FF8A8A', paddingHorizontal: 14, fontWeight: '700' },
});
