import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal } from '../src/crud-modal';
import { apiGetWithQuery } from '../src/api';
import { createItem, deleteItem, updateItem } from '../src/api-hooks';
import { showError } from '../src/toast';
import { SortFilterBar } from '../src/filters';

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

  const fields = useMemo<any[]>(() => [
    { key: 'course_code', label: 'Course Code', placeholder: 'CSC 301', step: 1 },
    { key: 'course_title', label: 'Course Title', placeholder: 'Database Systems', step: 1 },
    { key: 'lecturer_name', label: 'Lecturer Name', placeholder: 'Dr. Smith', step: 1 },
    { key: 'venue', label: 'Venue', placeholder: 'LT 101', step: 2 },
    { key: 'day_of_week', label: 'Day of Week', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], step: 2 },
    { key: 'start_time', label: 'Start Time', fieldType: 'time', placeholder: '09:00', step: 2 },
    { key: 'end_time', label: 'End Time', fieldType: 'time', placeholder: '11:00', step: 2 },
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
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { 
    setSelected(null); 
    setDraft({ course_code: '', course_title: '', lecturer_name: '', venue: '', day_of_week: 'Monday', start_time: '', end_time: '' }); 
    setMode('create'); 
  };
  const openEdit = (item: any) => { 
    setSelected(item); 
    setDraft({ 
      course_code: item.course_code ?? item.courseCode ?? '', 
      course_title: item.course_title ?? item.courseTitle ?? '', 
      lecturer_name: item.lecturer_name ?? item.lecturerName ?? '', 
      venue: item.venue ?? '', 
      day_of_week: item.day_of_week ?? item.dayOfWeek ?? 'Monday', 
      start_time: item.start_time ?? item.startTime ?? '', 
      end_time: item.end_time ?? item.endTime ?? '' 
    }); 
    setMode('edit'); 
  };
  const submit = async () => {
    // Check for duplicate course in same semester
    const duplicate = items.find((item: any) => {
      if (mode === 'edit' && item.id === selected?.id) return false;
      const itemCourseCode = item.course_code ?? item.courseCode ?? '';
      const itemSemester = item.semester ?? '';
      return itemCourseCode.toLowerCase() === draft.course_code.toLowerCase() && itemSemester === draft.semester;
    });
    
    if (duplicate) {
      showError(`Course "${draft.course_code}" already exists for ${draft.semester}`);
      return;
    }

    const payload = { ...draft };
    if (mode === 'create') await createItem('/courses', payload);
    if (mode === 'edit' && selected) await updateItem(`/courses/${selected.id}`, payload);
    setMode(null);
    await load(1, false);
  };
  const remove = async (item: any) => { await deleteItem(`/courses/${item.id}`); await load(1, false); };

  return (
    <ScreenShell title="Courses">
      <View style={styles.header}>
        <PrimaryButton title="Add New Course" icon="add" onPress={openCreate} />
      </View>
      <GlassCard style={styles.searchCard}>
        <Ionicons name="search-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput 
          value={search} 
          onChangeText={setSearch} 
          placeholder="Search your courses..." 
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
        ListEmptyComponent={loading ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : <Text style={styles.empty}>No courses found.</Text>}
        onEndReached={() => { if (hasMore && !loading && !refreshing) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push({ pathname: '/details', params: { type: 'course', id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          >
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.course_code ?? item.courseCode}</Text>
                </View>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>{item.day_of_week ?? item.dayOfWeek ?? 'TBD'}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.course_title ?? item.courseTitle}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color={colors.muted} />
                  <Text style={styles.sub}>{item.lecturer_name ?? item.lecturerName ?? 'No Lecturer'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.meta}>{item.venue ?? 'No Venue'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.meta}>
                    {item.start_time ?? 'TBD'} - {item.end_time ?? 'TBD'}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={(e) => { e.stopPropagation(); openEdit(item); }} style={styles.editBtn}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); remove(item); }} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </GlassCard>
          </Pressable>
        )}
      />
      <CrudModal 
        visible={!!mode} 
        title={mode === 'edit' ? 'Edit Course' : 'Add Course'} 
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
  header: { padding: 16, paddingBottom: 10, marginBottom: 4 },
  searchCard: { marginHorizontal: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', minHeight: 52, marginBottom: 16 },
  searchInput: { color: '#fff', flex: 1, fontSize: 15 },
  list: { padding: 14, gap: 14, paddingBottom: 40 },
  card: { padding: 18, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeBadge: { backgroundColor: 'rgba(61, 124, 255, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  codeText: { color: colors.primary, fontWeight: '900', fontSize: 13 },
  dayBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayText: { color: '#D8E6FF', fontWeight: '800', fontSize: 11 },
  cardContent: { gap: 6 },
  name: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sub: { color: '#B2C3E1', fontSize: 14, fontWeight: '600' },
  meta: { color: '#8DA3C7', fontSize: 13, fontWeight: '500' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61, 124, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#A6B7D7', textAlign: 'center', marginTop: 40, fontSize: 15 },
});
