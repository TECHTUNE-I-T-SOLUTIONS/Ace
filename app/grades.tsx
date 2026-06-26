import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal } from '../src/crud-modal';
import { createItem, deleteItem, updateItem } from '../src/api-hooks';
import { apiGet } from '../src/api';
import { showError, showSuccess } from '../src/toast';
import { SortFilterBar } from '../src/filters';

const SEMESTER_OPTIONS = ['First Semester', 'Second Semester'];
const GRADE_POINTS = ['4.00', '3.75', '3.50', '3.25', '3.00', '2.75', '2.50', '2.25', '2.00', '1.00', '0.00'];

export default function GradesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('semester');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  const [showCourseAlert, setShowCourseAlert] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGet('/grades');
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load grades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res: any = await apiGet('/courses');
      setCourses(res.data ?? res ?? []);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);
  useEffect(() => { loadCourses(); }, []);

  const getCourseOptions = () => {
    if (courses.length === 0) return [];
    return courses.map((c: any) => `${c.course_code} - ${c.course_title}`);
  };

  const fields = useMemo(() => [
    { 
      key: 'course_id', 
      label: 'Course', 
      type: 'select',
      options: getCourseOptions(),
      placeholder: courses.length === 0 ? 'No courses available' : 'Select a course',
    },
    { 
      key: 'semester', 
      label: 'Semester', 
      type: 'select',
      options: SEMESTER_OPTIONS,
      placeholder: 'Select semester',
    },
    { key: 'credit_units', label: 'Credit Units', type: 'number', placeholder: 'e.g. 3' },
    { 
      key: 'grade_point', 
      label: 'Grade Point', 
      type: 'select',
      options: GRADE_POINTS,
      placeholder: 'Select grade',
    },
  ], [courses]);

  const openCreate = () => {
    if (courses.length === 0) {
      setShowCourseAlert(true);
      return;
    }
    setSelected(null);
    setDraft({ course_id: '', semester: '', credit_units: '', grade_point: '' });
    setMode('create');
  };

  const openEdit = (item: any) => {
    setSelected(item);
    const course = courses.find((c: any) => c.id === item.course_id);
    const courseLabel = course ? `${course.course_code} - ${course.course_title}` : '';
    
    setDraft({
      course_id: courseLabel,
      semester: item.semester ?? '',
      credit_units: item.credit_units?.toString() ?? '',
      grade_point: item.grade_point?.toString() ?? '',
    });
    setMode('edit');
  };

  const validateDraft = () => {
    if (!draft.course_id || draft.course_id === '') {
      showError('Please select a course');
      return false;
    }
    if (!draft.semester || draft.semester === '') {
      showError('Please select a semester');
      return false;
    }
    if (!draft.grade_point || draft.grade_point === '') {
      showError('Please select a grade point');
      return false;
    }
    if (!draft.credit_units || draft.credit_units === '') {
      showError('Please enter credit units');
      return false;
    }
    return true;
  };

  const getCourseIdFromLabel = (label: string) => {
    const course = courses.find((c: any) => `${c.course_code} - ${c.course_title}` === label);
    return course?.id || '';
  };

  const submit = async () => {
    if (!validateDraft()) return;

    try {
      const courseId = getCourseIdFromLabel(draft.course_id);
      if (!courseId) {
        showError('Invalid course selected');
        return;
      }

      const payload = {
        course_id: courseId,
        semester: draft.semester,
        credit_units: parseInt(draft.credit_units) || 0,
        grade_point: parseFloat(draft.grade_point) || 0,
      };

      if (mode === 'create') {
        await createItem('/grades', payload);
        showSuccess('Grade added successfully');
      } else if (mode === 'edit' && selected) {
        await updateItem(`/grades/${selected.id}`, payload);
        showSuccess('Grade updated successfully');
      }
      setMode(null);
      await load();
    } catch (error: any) {
      showError(error.message ?? 'Failed to save grade');
    }
  };

  const remove = async (item: any) => {
    try {
      await deleteItem(`/grades/${item.id}`);
      showSuccess('Grade deleted successfully');
      await load();
    } catch (error: any) {
      showError(error.message ?? 'Failed to delete grade');
    }
  };

  const getGradeColor = (gradePoint: number) => {
    if (gradePoint >= 3.5) return colors.success;
    if (gradePoint >= 3.0) return colors.primary;
    if (gradePoint >= 2.0) return colors.warning;
    return colors.danger;
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c: any) => c.id === courseId);
    return course ? `${course.course_code} - ${course.course_title}` : 'Unknown Course';
  };

  return (
    <ScreenShell title="Grades">
      <View style={styles.header}>
        <PrimaryButton title="New Grade" icon="add" onPress={openCreate} />
      </View>

          <GlassCard style={styles.searchCard}>
        <Ionicons name="search-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search grades..."
          placeholderTextColor="#7E92B9"
          style={styles.searchInput}
          onSubmitEditing={() => load(1, false)}
        />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.loader} />
      ) : items.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="school-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>No grades yet</Text>
          <Text style={styles.emptySubtext}>Add your first grade to get started</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
          renderItem={({ item }) => {
            const gradeColor = getGradeColor(parseFloat(item.grade_point) || 0);
            return (
              <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '20' }]}>
                    <Text style={[styles.gradeText, { color: gradeColor }]}>
                      {parseFloat(item.grade_point).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.semesterBadge}>
                    <Text style={styles.semesterText}>{item.semester}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.courseName}>{getCourseName(item.course_id)}</Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="library-outline" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>{item.credit_units} Credits</Text>
                    </View>
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
      )}

      <CrudModal
        visible={!!mode}
        title={mode === 'edit' ? 'Edit Grade' : 'New Grade'}
        fields={fields}
        values={draft}
        onChange={setDraft}
        onClose={() => setMode(null)}
        onSubmit={submit}
        totalSteps={1}
      />

      {showCourseAlert && (
        <View style={styles.alertOverlay}>
          <GlassCard style={styles.alertCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={styles.alertTitle}>No Courses Found</Text>
            <Text style={styles.alertMessage}>
              You need to create at least one course before adding grades.
            </Text>
            <View style={styles.alertButtons}>
              <PrimaryButton
                title="Create Course"
                onPress={() => {
                  setShowCourseAlert(false);
                  router.push('/courses');
                }}
              />
              <Pressable onPress={() => setShowCourseAlert(false)} style={styles.alertDismiss}>
                <Text style={styles.alertDismissText}>Cancel</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 10 },
  searchCard: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    marginBottom: 16,
  },
  searchInput: { color: '#fff', flex: 1, fontSize: 15 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { padding: 20, gap: 14, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  gradeText: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  semesterBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  semesterText: { color: '#D8E6FF', fontWeight: '800', fontSize: 11 },
  cardContent: { gap: 8 },
  courseName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#8DA3C7', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61, 124, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 40, alignItems: 'center', gap: 12, marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptySubtext: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  alertOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertCard: { padding: 32, alignItems: 'center', gap: 16, maxWidth: 320 },
  alertTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 8 },
  alertMessage: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  alertButtons: { width: '100%', gap: 12, marginTop: 8 },
  alertDismiss: { padding: 14, alignItems: 'center' },
  alertDismissText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});