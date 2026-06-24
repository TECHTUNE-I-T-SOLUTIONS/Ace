import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientShell, PrimaryButton } from '@/components';
import { apiGet } from '@/api';
import { showError, showSuccess } from '@/toast';
import { useAuth } from '@/auth-context';
import { colors } from '@/theme';

export default function Dashboard() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [agenda, setAgenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    Promise.all([apiGet<any>('/users/me'), apiGet<any>('/analytics/overview'), apiGet<any>('/calendar/agenda')])
      .then(([me, overview, calendar]) => {
        setProfile(me);
        setAnalytics(overview);
        setAgenda(calendar);
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
            <View>
              <Text style={styles.hello}>Welcome back,</Text>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.meta}>{displayFaculty} • {displayDepartment} • {displayLevel}</Text>
            </View>
            <Pressable onPress={handleSignOut} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </Pressable>
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

        <View style={styles.quickNav}>
          <NavChip label="Courses" icon="book-outline" onPress={() => router.push('/courses')} />
          <NavChip label="Assignments" icon="document-text-outline" onPress={() => router.push('/assignments')} />
          <NavChip label="Calendar" icon="calendar-outline" onPress={() => router.push('/(tabs)/calendar')} />
          <NavChip label="Notes" icon="reader-outline" onPress={() => router.push('/notes')} />
          <NavChip label="Analytics" icon="stats-chart-outline" onPress={() => router.push('/analytics')} />
          <NavChip label="AI" icon="sparkles-outline" onPress={() => router.push('/ai')} />
          {completionMissing.length > 0 ? <NavChip label="Profile" icon="person-circle-outline" onPress={goToCompleteProfile} /> : null}
        </View>

        {loading ? <ActivityIndicator color="#fff" /> : null}

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

        <GlassCard style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <PrimaryButton title="Complete Profile" variant="ghost" onPress={goToCompleteProfile} />
            <PrimaryButton title="Sign Out" variant="ghost" onPress={handleSignOut} />
          </View>
        </GlassCard>
      </ScrollView>
    </GradientShell>
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

function NavChip({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navChip}>
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={styles.navText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 24, gap: 14 },
  hero: { backgroundColor: '#2458D5', borderRadius: 30, padding: 18, paddingTop: 22, paddingBottom: 18, gap: 14 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  hello: { color: '#DCE8FF', fontSize: 15, fontWeight: '600' },
  name: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 2 },
  meta: { color: '#EAF1FF', marginTop: 4, fontSize: 13, fontWeight: '600' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center', backgroundColor: 'rgba(8, 22, 41, 0.25)' },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bannerBody: { color: '#E4EEFF', marginTop: 4, fontSize: 12, lineHeight: 18 },
  quickNav: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: '#16253F' },
  navText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', padding: 14, gap: 8, minHeight: 108 },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#B7C7E7', fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionAction: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  listCard: { padding: 12 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  itemSub: { color: '#9EB2D3', marginTop: 2, fontSize: 12 },
  itemTime: { color: '#4C86FF', fontWeight: '800', fontSize: 13 },
  empty: { color: '#A6B7D7', fontSize: 13, paddingVertical: 10 },
  actionCard: { padding: 14, gap: 10 },
  actionRow: { flexDirection: 'row', gap: 12 },
});
