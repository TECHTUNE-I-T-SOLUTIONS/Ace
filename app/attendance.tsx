import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal } from '../src/crud-modal';
import { createItem, deleteItem, updateItem, useCrudList } from '../src/api-hooks';
import { SortFilterBar } from '../src/filters';
import { apiGet } from '../src/api';
import { showError, showSuccess } from '../src/toast';

export default function AttendanceScreen() {
  const { items, loading, refresh } = useCrudList<any>('/attendance', { sortBy: 'created_at', order: 'desc' });
  const [courses, setCourses] = useState<any[]>([]);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('course_id');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);

  const loadCourses = async () => {
    try {
      const res: any = await apiGet('/courses');
      setCourses(res.data ?? res ?? []);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load courses');
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const getCourseLabel = (course: any) => `${course.course_code} - ${course.course_title}`;
  const getCourseOptions = () => courses.map(getCourseLabel);
  const getCourseIdFromLabel = (label: string) => courses.find((course: any) => getCourseLabel(course) === label)?.id || '';
  const getCourseName = (courseId: string) => {
    const course = courses.find((course: any) => course.id === courseId);
    return course ? getCourseLabel(course) : courseId;
  };

  const fields = useMemo(() => [
    { key: 'course_id', label: 'Course', fieldType: 'select' as const, options: getCourseOptions(), placeholder: courses.length === 0 ? 'No courses available' : 'Select a course' },
    { key: 'classes_held', label: 'Classes Held', keyboardType: 'numeric' as const, placeholder: '12' },
    { key: 'classes_attended', label: 'Classes Attended', keyboardType: 'numeric' as const, placeholder: '11' },
  ], [courses]);

  const open = (item?: any) => {
    const course = courses.find((c: any) => c.id === item?.course_id);
    setSelected(item ?? null);
    setDraft({
      course_id: course ? getCourseLabel(course) : '',
      classes_held: item?.classes_held?.toString() ?? '',
      classes_attended: item?.classes_attended?.toString() ?? '',
    });
    setMode(item ? 'edit' : 'create');
  };

  const validateDraft = () => {
    if (!draft.course_id) {
      showError('Please select a course');
      return false;
    }
    if (!draft.classes_held) {
      showError('Please enter classes held');
      return false;
    }
    if (!draft.classes_attended) {
      showError('Please enter classes attended');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateDraft()) return;

    const courseId = getCourseIdFromLabel(draft.course_id);
    if (!courseId) {
      showError('Invalid course selected');
      return;
    }

    const payload = {
      course_id: courseId,
      classes_held: parseInt(draft.classes_held) || 0,
      classes_attended: parseInt(draft.classes_attended) || 0,
    };

    try {
      if (mode === 'create') {
        await createItem('/attendance', payload);
        showSuccess('Attendance record added successfully');
      }
      if (mode === 'edit' && selected) {
        await updateItem(`/attendance/${selected.id}`, payload);
        showSuccess('Attendance record updated successfully');
      }
      setMode(null);
      await refresh();
    } catch (error: any) {
      showError(error.message ?? 'Failed to save attendance record');
    }
  };

  return (
    <ScreenShell title="Attendance">
    <GradientShell>
      <View style={styles.header}><PrimaryButton title="New Record" icon="add" onPress={() => open()} /></View>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      {loading ? <ActivityIndicator color="#fff" /> : null}
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} renderItem={({ item }) => <GlassCard style={styles.card}><Text style={styles.name}>{getCourseName(item.course_id)}</Text><Text style={styles.sub}>{item.classes_attended}/{item.classes_held} classes</Text><Text style={styles.percent}>{item.attendance_percentage ?? 0}%</Text><View style={styles.actions}><Pressable onPress={() => open(item)}><Text style={styles.action}>Edit</Text></Pressable><Pressable onPress={async () => { await deleteItem(`/attendance/${item.id}`); await refresh(); }}><Text style={[styles.action, styles.danger]}>Delete</Text></Pressable></View></GlassCard>} />
      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Attendance' : 'New Attendance'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
    </ScreenShell>
  );
}
const styles = StyleSheet.create({ header:{padding:14,gap:12}, title:{color:'#fff',fontSize:30,fontWeight:'900'}, list:{padding:14,gap:12}, card:{padding:14,gap:8}, name:{color:'#fff',fontSize:18,fontWeight:'900'}, sub:{color:'#B2C3E1'}, percent:{color:'#4C86FF',fontWeight:'900'}, actions:{flexDirection:'row',gap:16}, action:{color:'#86A8FF',fontWeight:'800'}, danger:{color:'#FF6B6B'} });
