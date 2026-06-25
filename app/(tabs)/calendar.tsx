import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { apiGet } from '@/api';
import { showError } from '@/toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const [events, setEvents] = useState<any>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    apiGet('/calendar/agenda').then(setEvents).catch((error) => showError(error.message));
  }, []);

  const monthDate = useMemo(() => {
    const base = new Date();
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [monthOffset]);

  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

  const monthViews = useMemo(() => {
    return [-1, 0, 1].map((offset) => {
      const date = new Date(monthDate);
      date.setMonth(monthDate.getMonth() + offset);
      return date;
    });
  }, [monthDate]);

  const eventMap = useMemo(() => {
    const map = new Map<string, any[]>();
    const add = (day: string, item: any) => {
      if (!day) return;
      map.set(day, [...(map.get(day) ?? []), item]);
    };
    (events?.courses ?? []).forEach((item: any) => add(String(item.day_of_week ?? item.dayOfWeek ?? ''), { type: 'class', title: item.course_title ?? item.courseTitle, meta: item.start_time ?? item.startTime }));
    (events?.assignments ?? []).forEach((item: any) => add(String(item.deadline_date ?? item.deadlineDate ?? ''), { type: 'assignment', title: item.title, meta: item.status ?? 'pending' }));
    (events?.tests ?? []).forEach((item: any) => add(String(item.date ?? ''), { type: 'test', title: item.title, meta: item.time ?? 'TBD' }));
    (events?.exams ?? []).forEach((item: any) => add(String(item.date ?? ''), { type: 'exam', title: item.title, meta: item.time ?? 'TBD' }));
    (events?.sessions ?? []).forEach((item: any) => add(String(item.date ?? ''), { type: 'study', title: item.subject, meta: item.start_time ?? '' }));
    return map;
  }, [events]);

  const selectedKey = selectedDay ? `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : '';
  const selectedEvents = eventMap.get(selectedKey) ?? [];

  const changeMonth = (offset: number) => setMonthOffset(offset);

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Calendar</Text>
          <Pressable onPress={() => setShowMonthPicker(true)} style={styles.monthBar}>
            <Ionicons name="chevron-back" color="#fff" size={18} onPress={() => changeMonth(monthOffset - 1)} />
            <Text style={styles.month}>{monthLabel}</Text>
            <Ionicons name="chevron-forward" color="#fff" size={18} onPress={() => changeMonth(monthOffset + 1)} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width }}
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width) - 1;
            setMonthOffset((current) => current + page);
            requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: width, animated: false }));
          }}
        >
          {monthViews.map((month) => (
            <View key={month.toISOString()} style={[styles.monthPage, { width }]}>
              <GlassCard style={styles.panel}>
                <View style={styles.gridHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <Text key={day} style={styles.day}>{day}</Text>)}
                </View>
                <View style={styles.grid}>
                  {Array.from({ length: 42 }, (_, index) => index).map((index) => {
                    const first = new Date(month.getFullYear(), month.getMonth(), 1);
                    const startDay = first.getDay();
                    const date = index - startDay + 1;
                    const isCurrent = date > 0 && date <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                    const iso = isCurrent ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}` : '';
                    const labels = eventMap.get(iso) ?? [];
                    const selected = selectedDay === date && month.getMonth() === monthDate.getMonth();
                    return (
                      <Pressable key={`${month.toISOString()}-${index}`} onPress={() => isCurrent && setSelectedDay(date)} style={[styles.cell, !isCurrent && styles.fadedCell, selected && styles.cellSelected]}>
                        <Text style={[styles.date, !isCurrent && styles.fadedText, selected && styles.dateSelected]}>{isCurrent ? date : ''}</Text>
                        <View style={styles.dots}>
                          {labels.some((item) => item.type === 'class') ? <View style={[styles.dot, styles.blue]} /> : null}
                          {labels.some((item) => item.type === 'assignment') ? <View style={[styles.dot, styles.pink]} /> : null}
                          {labels.some((item) => item.type === 'exam') ? <View style={[styles.dot, styles.red]} /> : null}
                          {labels.some((item) => item.type === 'study') ? <View style={[styles.dot, styles.green]} /> : null}
                          {labels.some((item) => item.type === 'test') ? <View style={[styles.dot, styles.orange]} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            </View>
          ))}
        </ScrollView>

        <GlassCard style={styles.detailCard}>
          <Text style={styles.section}>Selected Day</Text>
          <Text style={styles.detailText}>{selectedDay ? `${monthLabel} ${selectedDay}` : 'Tap a date to view event markers.'}</Text>
          {selectedEvents.length ? selectedEvents.map((item) => (
            <View key={`${item.type}-${item.title}`} style={styles.detailRow}>
              <View style={[styles.typePill, item.type === 'assignment' ? styles.pinkBg : item.type === 'exam' ? styles.redBg : item.type === 'study' ? styles.greenBg : item.type === 'test' ? styles.orangeBg : styles.blueBg]}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{item.title}</Text>
                <Text style={styles.detailMeta}>{item.meta}</Text>
              </View>
            </View>
          )) : null}
          <PrimaryButton title="Refresh Agenda" variant="ghost" onPress={() => apiGet('/calendar/agenda').then(setEvents).catch((error) => showError(error.message))} />
        </GlassCard>

        <GlassCard style={styles.shortcutCard}>
          <Text style={styles.section}>Quick Create</Text>
          <View style={styles.shortcutRow}>
            <Shortcut label="Course" onPress={() => router.push('/courses')} />
            <Shortcut label="Assignment" onPress={() => router.push('/assignments')} />
            <Shortcut label="Task" onPress={() => router.push('/(tabs)/tasks')} />
            <Shortcut label="Note" onPress={() => router.push('/notes')} />
          </View>
        </GlassCard>

        <Text style={styles.section}>Event Legend</Text>
        <View style={styles.legendRow}>
          <Legend color="#3D7CFF" label="Classes" />
          <Legend color="#B14CFF" label="Assignments" />
        </View>
        <View style={styles.legendRow}>
          <Legend color="#FF5C62" label="Exams" />
          <Legend color="#10C06D" label="Studies" />
        </View>
        <View style={styles.legendRow}>
          <Legend color="#F59E0B" label="Tests" />
          <View style={{ flex: 1 }} />
        </View>
      </ScrollView>

      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.section}>Select Month</Text>
            <ScrollView contentContainerStyle={styles.monthList}>
              {MONTHS.map((month, index) => (
                <Pressable key={month} onPress={() => { setMonthOffset(index - new Date().getMonth()); setShowMonthPicker(false); }} style={styles.monthItem}>
                  <Text style={styles.monthItemText}>{month}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </GradientShell>
  );
}

function Shortcut({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.shortcut}><Text style={styles.shortcutText}>{label}</Text></Pressable>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <GlassCard style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 14, gap: 14, paddingBottom: 24 },
  hero: { backgroundColor: '#2A61D9', borderRadius: 28, padding: 14, gap: 12 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18 },
  month: { color: '#fff', fontSize: 20, fontWeight: '900' },
  monthPage: { paddingHorizontal: 0 },
  panel: { padding: 12, gap: 10 },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 6 },
  day: { width: '14.2%', textAlign: 'center', color: '#AFC0DF', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 0.98, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 5 },
  fadedCell: { opacity: 0.2 },
  cellSelected: { backgroundColor: '#2D6CFF' },
  date: { color: '#fff', fontWeight: '800', fontSize: 13 },
  fadedText: { color: '#fff' },
  dateSelected: { color: '#fff' },
  dots: { flexDirection: 'row', gap: 2, minHeight: 8, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  blue: { backgroundColor: '#3D7CFF' },
  pink: { backgroundColor: '#B14CFF' },
  red: { backgroundColor: '#FF5C62' },
  green: { backgroundColor: '#10C06D' },
  orange: { backgroundColor: '#F59E0B' },
  section: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 },
  detailCard: { padding: 16, gap: 12 },
  detailText: { color: '#B2C3E1', lineHeight: 21 },
  detailRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  detailTitle: { color: '#fff', fontWeight: '800' },
  detailMeta: { color: '#9EB2D3', fontSize: 12, marginTop: 2 },
  typePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  blueBg: { backgroundColor: '#3D7CFF' },
  pinkBg: { backgroundColor: '#B14CFF' },
  redBg: { backgroundColor: '#FF5C62' },
  greenBg: { backgroundColor: '#10C06D' },
  orangeBg: { backgroundColor: '#F59E0B' },
  shortcutCard: { padding: 16, gap: 10 },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcut: { backgroundColor: '#132545', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  shortcutText: { color: '#fff', fontWeight: '800' },
  legendRow: { flexDirection: 'row', gap: 10 },
  legend: { flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  modalCard: { padding: 16, gap: 10 },
  monthList: { gap: 8, paddingTop: 6 },
  monthItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#132545' },
  monthItemText: { color: '#fff', fontWeight: '700' },
});
