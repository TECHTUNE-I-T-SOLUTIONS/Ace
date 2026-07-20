import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell, PrimaryButton } from '../../src/components';
import { apiGet, apiJson } from '../../src/api';
import { showError, showSuccess } from '../../src/toast';
import { useAuth } from '../../src/auth-context';
import { usePushTokenRegistration } from '../../src/use-push-token';
import { useReminderChecker } from '../../src/use-reminder-checker';
import { colors } from '../../src/theme';
import { formatDate, formatTime } from '../../src/utils/date-utils';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [agenda, setAgenda] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderData, setReminderData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reminderShownRef = useRef<Set<string>>(new Set());

  // Register push token on mount
  usePushTokenRegistration();
  
  // Check reminders every 5 minutes
  useReminderChecker(5 * 60 * 1000);

  const completionMissing = useMemo(() => {
    if (!profile) return [];
    return [
      !profile.full_name && 'Full name',
      !profile.institution && 'Institution',
      !profile.faculty && 'Faculty',
      !profile.department && 'Department',
      !profile.level && 'Level',
      !profile.student_id && 'Student ID',
    ].filter(Boolean) as string[];
  }, [profile]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [me, overview, calendar, notifs, coursesData, assignmentsData] = await Promise.all([
        apiGet<any>('/users/me'),
        apiGet<any>('/analytics/overview'),
        apiGet<any>('/calendar/agenda'),
        apiGet<any>('/notifications'),
        apiGet<any>('/courses'),
        apiGet<any>('/assignments'),
      ]);
      setProfile(me);
      setAnalytics(overview);
      setAgenda(calendar);
      setCourses(coursesData.data ?? coursesData ?? []);
      setAssignments(assignmentsData.data ?? assignmentsData ?? []);
      const unread = (notifs.data ?? notifs ?? []).filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      
      // Show reminder modal if there are upcoming events
      const today = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today];
      
      const todayClasses = calendar?.courses?.filter((c: any) => {
        const courseDay = c.day_of_week ?? c.dayOfWeek;
        return courseDay === todayName || courseDay === String(today);
      }) || [];
      
      const upcomingAssignments = calendar?.assignments?.filter((a: any) => {
        if (!a.deadline_date) return false;
        const deadline = new Date(a.deadline_date);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      }) || [];
      
      // Create a unique key for this reminder set
      const reminderKey = `${todayClasses.length}-${upcomingAssignments.length}-${today}`;
      
      // Only show reminder once per day
      if ((todayClasses.length > 0 || upcomingAssignments.length > 0) && !reminderShownRef.current.has(reminderKey)) {
        setReminderData({
          classes: todayClasses,
          assignments: upcomingAssignments,
        });
        setShowReminder(true);
        reminderShownRef.current.add(reminderKey);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = profile?.full_name || 'Student';
  const displayLevel = profile?.level ? `Level ${profile.level}` : 'Level not set';
  const displayDepartment = profile?.department || 'Department not set';
  const displayFaculty = profile?.faculty || 'Faculty not set';

  const stats = [
    { label: 'Courses', value: analytics?.courses ?? profile?.courses_count ?? 0, accent: '#3D7CFF', route: '/courses' },
    { label: 'Assignments', value: analytics?.assignments ?? profile?.assignments_count ?? 0, accent: '#B14CFF', route: '/assignments' },
    { label: 'Tests', value: analytics?.tests ?? 0, accent: '#F59E0B', route: '/tests' },
    { label: 'Exams', value: analytics?.exams ?? 0, accent: '#FF5C62', route: '/exams' },
  ];

  const goToCompleteProfile = () => router.push('/(auth)/profile-setup');

  const getValue = (item: any, keys: string[], fallback: string) => {
    for (const key of keys) {
      const val = item[key];
      if (val != null && String(val).trim() !== '') return String(val).trim();
    }
    return fallback;
  };

  const todayClasses = useMemo(() => {
    if (!courses.length) return [];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    return courses.filter((course: any) => {
      const courseDay = course.day_of_week ?? course.dayOfWeek;
      return courseDay === todayName || courseDay === String(today);
    }).slice(0, 4);
  }, [courses]);
  
  const assignmentItems = useMemo(() => {
    if (!assignments.length) return [];
    const today = new Date();
    return assignments
      .filter((a: any) => {
        if (!a.deadline_date) return false;
        const deadline = new Date(a.deadline_date);
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 14; // Next 14 days
      })
      .sort((a: any, b: any) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())
      .slice(0, 4);
  }, [assignments]);

  return (
    <GradientShell>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadData(true)} 
            tintColor="#fff" 
            colors={['#fff']} 
            progressBackgroundColor="#2458D5"
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.hello}>Welcome back,</Text>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
              <Text style={styles.meta} numberOfLines={1}>{displayDepartment}</Text>
              <Text style={styles.meta}>{displayLevel}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
              </Pressable>
              <Pressable onPress={() => router.push('/search')} style={styles.iconButton}>
                <Ionicons name="search" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
          {completionMissing.length > 0 ? (
            <GlassCard style={styles.banner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Complete your profile</Text>
                <Text style={styles.bannerBody}>Missing: {completionMissing.join(', ')}. Finish setup to personalize your dashboard.</Text>
              </View>
              <PrimaryButton title="Complete" variant="light" onPress={goToCompleteProfile} />
            </GlassCard>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Academic Services</Text>
        <View style={styles.serviceGrid}>
          <ServiceItem label="Courses" icon="book" color="#3D7CFF" onPress={() => router.push('/courses')} />
          <ServiceItem label="Assignments" icon="document-text" color="#B14CFF" onPress={() => router.push('/assignments')} />
          <ServiceItem label="Exams" icon="school" color="#FF5C62" onPress={() => router.push('/exams')} />
          <ServiceItem label="Tests" icon="flask" color="#F59E0B" onPress={() => router.push('/tests')} />
          <ServiceItem label="Grades" icon="medal" color="#10C06D" onPress={() => router.push('/grades')} />
          <ServiceItem label="Attendance" icon="calendar-clear-outline" color="#23B7FF" onPress={() => router.push('/attendance')} />
          <ServiceItem label="Notes" icon="create" color="#FF6B9D" onPress={() => router.push('/notes')} />
          <ServiceItem label="Analytics" icon="stats-chart" color="#9C27B0" onPress={() => router.push('/analytics')} />
        </View>

        {loading && <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />}

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.route)} style={styles.statCard}>
              <GlassCard style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: item.accent }]}>
                  <Ionicons name="stats-chart-outline" size={18} color="#fff" />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <Section title="Today's Classes" action={String(todayClasses.length)} />
        <GlassCard style={styles.listCard}>
          {todayClasses.length ? todayClasses.map((item: any, i: number) => (
            <Pressable 
              key={item.id ?? `${item.course_title}-${i}`} 
              style={[styles.rowItem, i !== todayClasses.length - 1 && styles.rowDivider]}
              onPress={() => router.push({ pathname: '/details', params: { type: 'course', id: item.id } })}
            >
              <View>
                <Text style={styles.itemTitle}>{getValue(item, ['course_title', 'courseTitle', 'title', 'name'], 'Untitled course')}</Text>
                <Text style={styles.itemSub}>{getValue(item, ['venue', 'venue_name', 'location', 'room', 'classroom', 'place'], 'Venue not set')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemTime}>{formatTime(item.start_time ?? item.startTime)}</Text>
                <Text style={styles.itemTime}>{formatTime(item.end_time ?? item.endTime)}</Text>
              </View>
            </Pressable>
          )) : <Text style={styles.empty}>No classes scheduled for today.</Text>}
        </GlassCard>

        <Section title="Upcoming Assignments" action={String(assignmentItems.length)} />
        <GlassCard style={styles.listCard}>
          {assignmentItems.length ? assignmentItems.slice(0, 4).map((item: any, i: number) => (
            <Pressable 
              key={item.id ?? `${item.title}-${i}`} 
              style={[styles.rowItem, i !== Math.min(assignmentItems.length, 4) - 1 && styles.rowDivider]}
              onPress={() => router.push({ pathname: '/details', params: { type: 'assignment', id: item.id } })}
            >
              <View>
                <Text style={styles.itemTitle}>{getValue(item, ['title', 'name'], 'Untitled')}</Text>
                <Text style={styles.itemSub}>{getValue(item, ['description', 'details', 'notes', 'content', 'info', 'body', 'text'], 'No description')}</Text>
              </View>
              <Text style={styles.itemTime}>{formatDate(item.deadline_date)}</Text>
            </Pressable>
          )) : <Text style={styles.empty}>No assignments yet.</Text>}
        </GlassCard>
      </ScrollView>

      {/* AI Assistant Floating Widget */}
      <Pressable 
        onPress={() => router.push('/ai')} 
        style={styles.aiFab}
      >
        <Ionicons name="sparkles" size={24} color="#fff" />
      </Pressable>

      {/* Daily Reminder Modal */}
      <Modal visible={showReminder} transparent animationType="fade" onRequestClose={() => setShowReminder(false)}>
        <Pressable style={styles.reminderBackdrop} onPress={() => setShowReminder(false)}>
          <Pressable style={styles.reminderCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderIcon}>
                <Ionicons name="alarm" size={28} color={colors.warning} />
              </View>
              <Text style={styles.reminderTitle}>Daily Reminder</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {reminderData?.classes?.length > 0 && (
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderSectionTitle}>Today's Classes</Text>
                  {reminderData.classes.slice(0, 3).map((item: any, i: number) => (
                    <Pressable 
                      key={i} 
                      style={styles.reminderItem}
                      onPress={() => {
                        setShowReminder(false);
                        router.push({ pathname: '/details', params: { type: 'course', id: item.id } });
                      }}
                    >
                      <View style={styles.reminderItemIcon}>
                        <Ionicons name="book" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reminderItemTitle}>{item.course_title ?? item.courseTitle}</Text>
                        <Text style={styles.reminderItemMeta}>
                          {item.start_time ?? 'TBD'} - {item.end_time ?? 'TBD'} • {item.venue ?? 'Venue TBD'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              )}

              {reminderData?.assignments?.length > 0 && (
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderSectionTitle}>Upcoming Assignments</Text>
                  {reminderData.assignments.slice(0, 3).map((item: any, i: number) => (
                    <Pressable 
                      key={i} 
                      style={styles.reminderItem}
                      onPress={() => {
                        setShowReminder(false);
                        router.push({ pathname: '/details', params: { type: 'assignment', id: item.id } });
                      }}
                    >
                      <View style={[styles.reminderItemIcon, { backgroundColor: 'rgba(177, 76, 255, 0.1)' }]}>
                        <Ionicons name="document-text" size={18} color="#B14CFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reminderItemTitle}>{item.title}</Text>
                        <Text style={styles.reminderItemMeta}>
                          Due: {formatDate(item.deadline_date)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.reminderButton}>
                <PrimaryButton 
                  title="Got it!" 
                  onPress={() => setShowReminder(false)} 
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </GradientShell>
  );
}

function ServiceItem({ label, icon, color, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.serviceItem}>
      <View style={[styles.serviceIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.serviceLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, action }: { title: string; action: number | string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 40, gap: 14 },
  hero: { backgroundColor: '#2458D5', borderRadius: 30, padding: 18, paddingBottom: 18, gap: 14 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  hello: { color: '#DCE8FF', fontSize: 15, fontWeight: '600' },
  name: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 2 },
  meta: { color: '#EAF1FF', marginTop: 4, fontSize: 13, fontWeight: '600' },
  iconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF5C62', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2458D5' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  banner: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center', backgroundColor: 'rgba(8, 22, 41, 0.25)' },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bannerBody: { color: '#E4EEFF', marginTop: 4, fontSize: 12, lineHeight: 18 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  serviceItem: { width: '22.5%', alignItems: 'center', gap: 6, marginBottom: 8 },
  serviceIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { color: colors.text, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  statCard: { padding: 16, gap: 4, minHeight: 110, justifyContent: 'center', marginBottom: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  statLabel: { color: '#B7C7E7', fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  sectionAction: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  listCard: { padding: 12, marginTop: 6 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  itemSub: { color: '#9EB2D3', marginTop: 2, fontSize: 12 },
  itemTime: { color: '#4C86FF', fontWeight: '800', fontSize: 13 },
  empty: { color: '#A6B7D7', fontSize: 13, paddingVertical: 10 },
  reminderBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  reminderCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, maxWidth: 400, width: '100%', maxHeight: '80%' },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  reminderIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  reminderSection: { marginBottom: 20 },
  reminderSectionTitle: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  reminderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 8 },
  reminderItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(61, 124, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  reminderItemTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  reminderItemMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  reminderButton: { marginTop: 10 },
  aiFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#A5A8AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 100,
  },
});
