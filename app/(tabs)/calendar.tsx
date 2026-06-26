import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '../../src/components';
import { apiGet } from '../../src/api';
import { showError } from '../../src/toast';
import { colors } from '../../src/theme';

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
          <View style={styles.monthBar}>
            <Pressable onPress={() => changeMonth(monthOffset - 1)} style={styles.chevron}>
              <Ionicons name="chevron-back" color="#fff" size={20} />
            </Pressable>
            <Pressable onPress={() => setShowMonthPicker(true)} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.month}>{monthLabel}</Text>
            </Pressable>
            <Pressable onPress={() => changeMonth(monthOffset + 1)} style={styles.chevron}>
              <Ionicons name="chevron-forward" color="#fff" size={20} />
            </Pressable>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const p = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              if (p !== 1) {
                setMonthOffset((current) => current + (p - 1));
                requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: width - 32, animated: false }));
              }
            }}
            contentOffset={{ x: width - 32, y: 0 }}
          >
            {monthViews.map((month) => (
              <View key={month.toISOString()} style={{ width: width - 32 }}>
                <View style={styles.panel}>
                  <View style={styles.gridHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <Text key={day} style={styles.day}>{day}</Text>)}
                  </View>
                  <View style={styles.grid}>
                    {Array.from({ length: 42 }, (_, index) => {
                      const first = new Date(month.getFullYear(), month.getMonth(), 1);
                      const startDay = first.getDay();
                      const date = index - startDay + 1;
                      const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                      const isCurrent = date > 0 && date <= last;
                      const iso = isCurrent ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}` : '';
                      const labels = eventMap.get(iso) ?? [];
                      const isSelected = selectedDay === date && month.getMonth() === monthDate.getMonth();
                      
                      return (
                        <Pressable 
                          key={index} 
                          onPress={() => isCurrent && setSelectedDay(date)} 
                          style={[styles.cell, !isCurrent && styles.fadedCell, isSelected && styles.cellSelected]}
                        >
                          <Text style={[styles.date, !isCurrent && styles.fadedText, isSelected && styles.dateSelected]}>
                            {isCurrent ? date : ''}
                          </Text>
                          <View style={styles.dots}>
                            {labels.slice(0, 3).map((item, i) => (
                              <View key={i} style={[styles.dot, getDotColor(item.type)]} />
                            ))}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <GlassCard style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Events for {selectedDay ? `${monthLabel} ${selectedDay}` : 'Selected Day'}</Text>
          {selectedEvents.length > 0 ? selectedEvents.map((item, idx) => (
            <View key={idx} style={styles.detailRow}>
              <View style={[styles.typePill, { backgroundColor: getDotColorHex(item.type) + '20' }]}>
                <Text style={[styles.typeText, { color: getDotColorHex(item.type) }]}>{item.type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{item.title}</Text>
                <Text style={styles.detailMeta}>{item.meta}</Text>
              </View>
            </View>
          )) : (
            <Text style={styles.detailText}>No events scheduled for this day.</Text>
          )}
          <PrimaryButton title="Refresh Agenda" variant="ghost" onPress={() => apiGet('/calendar/agenda').then(setEvents).catch((error) => showError(error.message))} />
        </GlassCard>

        <View style={styles.legendGrid}>
          <Legend color="#3D7CFF" label="Classes" />
          <Legend color="#B14CFF" label="Assignments" />
          <Legend color="#FF5C62" label="Exams" />
          <Legend color="#10C06D" label="Studies" />
          <Legend color="#F59E0B" label="Tests" />
        </View>
      </ScrollView>

      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMonthPicker(false)}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.monthList}>
                {MONTHS.map((month, index) => (
                  <Pressable 
                    key={month} 
                    onPress={() => { setMonthOffset(index - new Date().getMonth()); setShowMonthPicker(false); }} 
                    style={[styles.monthItem, monthDate.getMonth() === index && styles.monthItemActive]}
                  >
                    <Text style={[styles.monthItemText, monthDate.getMonth() === index && styles.activeText]}>{month}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </GlassCard>
        </Pressable>
      </Modal>
    </GradientShell>
  );
}

function getDotColor(type: string) {
  switch (type) {
    case 'class': return styles.blue;
    case 'assignment': return styles.pink;
    case 'exam': return styles.red;
    case 'study': return styles.green;
    case 'test': return styles.orange;
    default: return styles.blue;
  }
}

function getDotColorHex(type: string) {
  switch (type) {
    case 'class': return '#3D7CFF';
    case 'assignment': return '#B14CFF';
    case 'exam': return '#FF5C62';
    case 'study': return '#10C06D';
    case 'test': return '#F59E0B';
    default: return '#3D7CFF';
  }
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, borderRadius: 28, padding: 20, gap: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 4 },
  chevron: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  month: { color: '#fff', fontSize: 18, fontWeight: '800' },
  calendarContainer: { marginHorizontal: -16, paddingHorizontal: 16 },
  panel: { backgroundColor: colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  day: { width: '14.2%', textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4 },
  fadedCell: { opacity: 0.15 },
  cellSelected: { backgroundColor: colors.primary },
  date: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fadedText: { color: '#fff' },
  dateSelected: { color: '#fff' },
  dots: { flexDirection: 'row', gap: 3, minHeight: 6, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  blue: { backgroundColor: '#3D7CFF' },
  pink: { backgroundColor: '#B14CFF' },
  red: { backgroundColor: '#FF5C62' },
  green: { backgroundColor: '#10C06D' },
  orange: { backgroundColor: '#F59E0B' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  detailCard: { padding: 20, gap: 14 },
  detailText: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  detailRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 16 },
  detailTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  detailMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#E1E9F5', fontSize: 12, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { padding: 24, maxHeight: '80%' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  monthList: { gap: 10 },
  monthItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  monthItemActive: { backgroundColor: 'rgba(61, 124, 255, 0.1)', borderWidth: 1, borderColor: colors.primary },
  monthItemText: { color: '#E1E9F5', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  activeText: { color: colors.primary },
});
