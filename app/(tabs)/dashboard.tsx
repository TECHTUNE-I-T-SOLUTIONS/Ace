import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell, PrimaryButton } from '../../src/components';
import { apiGet } from '../../src/api';
import { showError, showSuccess } from '../../src/toast';
import { useAuth } from '../../src/auth-context';
import { usePushTokenRegistration } from '../../src/use-push-token';
import LogoutModal from '../../src/logout-modal';
import { colors } from '../../src/theme';

export default function Dashboard() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [agenda, setAgenda] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  // Register push token on mount
  usePushTokenRegistration();

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

  useEffect(() => {
    Promise.all([
      apiGet<any>('/users/me'),
      apiGet<any>('/analytics/overview'),
      apiGet<any>('/calendar/agenda'),
      apiGet<any>('/notifications'),
    ])
      .then(([me, overview, calendar, notifs]) => {
        setProfile(me);
        setAnalytics(overview);
        setAgenda(calendar);
        const unread = (notifs.data ?? notifs ?? []).filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch((error) => showError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.full_name || 'Student';
  const displayLevel = profile?.level ? `Level ${profile.level}` : 'Level not set';
  const displayDepartment = profile?.department || 'Department not set';
  const displayFaculty = profile?.faculty || 'Faculty not set';

  const stats = [
    { label: 'Courses', value: analytics?.courses ?? profile?.courses_count ?? 0, accent: '#3D7CFF' },
    { label: 'Assignments', value: analytics?.assignments ?? profile?.assignments_count ?? 0, accent: '#B14CFF' },
    { label: 'Tests', value: analytics?.tests ?? 0, accent: '#F59E0B' },
    { label: 'Exams', value: analytics?.exams ?? 0, accent: '#10C06D' },
  ];

  const goToCompleteProfile = () => router.push('/(auth)/profile-setup');
  const handleSignOut = async () => {
    await signOut();
    showSuccess('Signed out');
    router.replace('/(auth)/login');
  };

  const classItems = agenda?.courses ?? [];
  const assignmentItems = agenda?.assignments ?? [];

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.hello}>Welcome back,</Text>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
              <Text style={styles.meta} numberOfLines={1}>{displayFaculty} • {displayDepartment}</Text>
              <Text style={styles.meta}>{displayLevel}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
              </Pressable>
              <Pressable onPress={() => setShowLogout(true)} style={styles.iconButton}>
                <Ionicons name="log-out-outline" size={22} color="#fff" />
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
          <ServiceItem label="Search" icon="search" color="#AFC0DF" onPress={() => router.push('/search')} />
          <ServiceItem label="Settings" icon="settings" color="#7B8EAF" onPress={() => router.push('/settings')} />
          <ServiceItem label="Audit Logs" icon="shield-checkmark" color="#6F5DFF" onPress={() => router.push('/audit-logs')} />
          <ServiceItem label="AI Assistant" icon="sparkles" color="#FFD700" onPress={() => router.push('/ai')} />
        </View>

        {loading && <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />}

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <GlassCard key={item.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: item.accent }]}>
                <Ionicons name="stats-chart-outline" size={18} color="#fff" />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </GlassCard>
          ))}
        </View>

        <Section title="Today's Classes" action={String(classItems.length)} />
        <GlassCard style={styles.listCard}>
          {classItems.length ? classItems.slice(0, 4).map((item: any, i: number) => (
            <View key={item.id ?? `${item.course_title}-${i}`} style={[styles.rowItem, i !== Math.min(classItems.length, 4) - 1 && styles.rowDivider]}>
              <View>
                <Text style={styles.itemTitle}>{item.course_title ?? item.courseTitle ?? 'Untitled course'}</Text>
                <Text style={styles.itemSub}>{item.venue ?? 'Venue not set'}</Text>
              </View>
              <Text style={styles.itemTime}>{item.start_time ?? item.startTime ?? 'TBD'}</Text>
            </View>
          )) : <Text style={styles.empty}>No classes scheduled yet.</Text>}
        </GlassCard>

        <Section title="Upcoming Assignments" action={String(assignmentItems.length)} />
        <GlassCard style={styles.listCard}>
          {assignmentItems.length ? assignmentItems.slice(0, 4).map((item: any, i: number) => (
            <View key={item.id ?? `${item.title}-${i}`} style={[styles.rowItem, i !== Math.min(assignmentItems.length, 4) - 1 && styles.rowDivider]}>
              <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.description ?? 'No description'}</Text>
              </View>
              <Text style={styles.itemTime}>{item.deadline_date ? new Date(item.deadline_date).toLocaleDateString() : 'TBD'}</Text>
            </View>
          )) : <Text style={styles.empty}>No assignments yet.</Text>}
        </GlassCard>
      </ScrollView>

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleSignOut}
      />
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
  serviceLabel: { color: '#B7C7E7', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', padding: 16, gap: 6, minHeight: 110, justifyContent: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  statLabel: { color: '#B7C7E7', fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  sectionAction: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  listCard: { padding: 12 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  itemSub: { color: '#9EB2D3', marginTop: 2, fontSize: 12 },
  itemTime: { color: '#4C86FF', fontWeight: '800', fontSize: 13 },
  empty: { color: '#A6B7D7', fontSize: 13, paddingVertical: 10 },
});
