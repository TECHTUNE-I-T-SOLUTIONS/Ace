import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '../../src/components';
import { colors } from '../../src/theme';
import { apiGet, apiJson } from '../../src/api';
import { useAuth } from '../../src/auth-context';
import { showError, showSuccess } from '../../src/toast';
import LogoutModal from '../../src/logout-modal';
import { pickImage, storagePath, uploadToSupabase } from '../../src/storage';
import { supabase } from '../../src/lib/supabase';
import { getActiveSchool } from '../../src/schools';

export default function Profile() {
  const school = getActiveSchool();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { signOut, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    institution: '',
    faculty: '',
    department: '',
    level: '',
    student_id: '',
  });
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  const facultyOptions = school.faculties;
  const selectedFaculty = useMemo(() => facultyOptions.find((item) => item.name === form.faculty) ?? null, [form.faculty, facultyOptions]);
  const departmentOptions = selectedFaculty?.departments ?? [];

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [me, overview] = await Promise.all([
        apiGet<any>('/users/me'),
        apiGet<any>('/analytics/overview'),
      ]);
      setProfile(me);
      setAnalytics(overview);
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

  const uploadAvatar = async () => {
    try {
      setUploading(true);
      if (!supabase) throw new Error('Supabase not configured');
      const asset = await pickImage();
      if (!asset) return;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('No authenticated user');
      const path = storagePath('avatars', asset.fileName ?? 'avatar.jpg', userId);
      const publicUrl = await uploadToSupabase('avatars', asset.uri, path);
      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl, avatar_path: path }).eq('id', userId);
      if (error) throw error;
      setProfile((current: any) => ({ ...current, avatar_url: publicUrl, avatar_path: path }));
    } catch (error: any) {
      showError(error.message ?? 'Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openEdit = () => {
    setForm({
      full_name: profile?.full_name ?? '',
      institution: profile?.institution ?? school.name,
      faculty: profile?.faculty ?? '',
      department: profile?.department ?? '',
      level: profile?.level ?? '',
      student_id: profile?.student_id ?? '',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await apiJson('/users/me', 'PATCH', form);
      showSuccess('Profile updated successfully');
      setEditing(false);
      const updated = await apiGet<any>('/users/me');
      setProfile(updated);
    } catch (error: any) {
      showError(error.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showSuccess('Signed out');
    router.replace('/(auth)/login');
  };

  const labelOr = (value: string | null | undefined, fallback: string) => (value?.trim() ? value : fallback);

  if (loading) {
    return (
      <GradientShell>
        <View style={styles.loadingWrap}><ActivityIndicator color="#fff" /></View>
      </GradientShell>
    );
  }

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
            progressBackgroundColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings" size={20} color="#fff" />
          </Pressable>
          
          <Pressable onPress={uploadAvatar} style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          
          <View style={styles.heroInfo}>
            <Text style={styles.name}>{labelOr(profile?.full_name, 'New Student')}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{profile?.level ? `Level ${profile.level}` : 'Level TBD'}</Text>
              </View>
              <Text style={styles.studentId}>{labelOr(profile?.student_id, 'No ID')}</Text>
            </View>
          </View>

          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadingText}>Updating photo...</Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.courses ?? profile?.courses_count ?? 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.assignments ?? profile?.assignments_count ?? 0}</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </GlassCard>
          {/* <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.tests ?? 0}</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.exams ?? 0}</Text>
            <Text style={styles.statLabel}>Exams</Text>
          </GlassCard> */}
          {/* <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.tasks ?? 0}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </GlassCard> */}
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.attendance ?? 0}</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.cgpa || profile?.gpa || '0.0'}</Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </GlassCard>
          {/* <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.level ? `Level ${profile.level}` : 'N/A'}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </GlassCard> */}
        </View>

        <GlassCard style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Academic Information</Text>
          </View>
          
          <View style={styles.fieldList}>
            <InfoField label="Institution" value={labelOr(profile?.institution, 'Not specified')} icon="business-outline" />
            <InfoField label="Faculty" value={labelOr(profile?.faculty, 'Not specified')} icon="library-outline" />
            <InfoField label="Department" value={labelOr(profile?.department, 'Not specified')} icon="git-network-outline" />
            <InfoField label="Email Address" value={labelOr(profile?.email, 'Not specified')} icon="mail-outline" />
          </View>
        </GlassCard>

        <PrimaryButton title="Edit Profile Details" variant="ghost" icon="create-outline" onPress={openEdit} />

        <PrimaryButton title="Sign Out" variant="light" icon="log-out-outline" onPress={() => setShowLogout(true)} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <GradientShell>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setEditing(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                value={form.full_name}
                onChangeText={(text) => setForm((current) => ({ ...current, full_name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#7E92B9"
                style={styles.formInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Institution</Text>
              <Pressable onPress={() => setForm((current) => ({ ...current, institution: school.name }))} style={styles.selector}>
                <Text style={styles.selectorText}>{form.institution || school.name}</Text>
                <Text style={styles.selectorCaret}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Faculty</Text>
              <Pressable onPress={() => setShowFacultyPicker(true)} style={styles.selector}>
                <Text style={styles.selectorText}>{form.faculty || 'Select faculty'}</Text>
                <Text style={styles.selectorCaret}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <Pressable 
                onPress={() => (selectedFaculty ? setShowDepartmentPicker(true) : showError('Choose a faculty first'))} 
                style={styles.selector}
              >
                <Text style={styles.selectorText}>{form.department || 'Select department'}</Text>
                <Text style={styles.selectorCaret}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Level</Text>
              <View style={styles.levelSelector}>
                {['100', '200', '300', '400', '500'].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setForm((current) => ({ ...current, level }))}
                    style={[styles.levelOption, form.level === level && styles.levelOptionActive]}
                  >
                    <Text style={[styles.levelOptionText, form.level === level && styles.levelOptionTextActive]}>{level}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student ID</Text>
              <TextInput
                value={form.student_id}
                onChangeText={(text) => setForm((current) => ({ ...current, student_id: text }))}
                placeholder="Enter student ID"
                placeholderTextColor="#7E92B9"
                style={styles.formInput}
              />
            </View>

            <View style={styles.modalActions}>
              <View style={styles.saveButton}>
                <PrimaryButton
                  title={saving ? 'Saving...' : 'Save Changes'}
                  onPress={saveProfile}
                />
              </View>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </GradientShell>
      </Modal>

      <PickerModal
        visible={showFacultyPicker}
        title="Select Faculty"
        options={facultyOptions.map((item) => item.name)}
        onClose={() => setShowFacultyPicker(false)}
        onSelect={(value) => {
          setForm((current) => ({ ...current, faculty: value, department: '' }));
          setShowFacultyPicker(false);
        }}
      />

      <PickerModal
        visible={showDepartmentPicker}
        title="Select Department"
        options={departmentOptions.map((item) => item.name)}
        onClose={() => setShowDepartmentPicker(false)}
        onSelect={(value) => {
          setForm((current) => ({ ...current, department: value }));
          setShowDepartmentPicker(false);
        }}
      />

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleSignOut}
      />

    </GradientShell>
  );
}

function PickerModal({ visible, title, options, onClose, onSelect }: { visible: boolean; title: string; options: string[]; onClose: () => void; onSelect: (value: string) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable key={option} onPress={() => onSelect(option)} style={styles.optionRow}>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.fieldItem}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={18} color={colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  hero: { 
    backgroundColor: colors.primary, 
    borderRadius: 32, 
    padding: 24, 
    alignItems: 'center', 
    gap: 16,
    overflow: 'hidden',
  },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4, 
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  editIconBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: colors.background, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroInfo: { alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  studentId: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  uploadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', padding: 16, alignItems: 'center', gap: 4 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  infoCard: { padding: 20, gap: 20 },
  iconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', position: 'relative' }, 
  settingsButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', position: 'absolute', marginRight: -280, marginTop: 20 }, 
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  fieldList: { gap: 18 },
  fieldItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  fieldValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalContent: { padding: 20, gap: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  formGroup: { gap: 8 },
  formLabel: { color: '#B7C7E7', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  formInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  levelSelector: { flexDirection: 'row', gap: 8 },
  levelOption: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  levelOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelOptionText: { color: '#B7C7E7', fontWeight: '800', fontSize: 14 },
  levelOptionTextActive: { color: '#fff' },
  modalActions: { gap: 12, marginTop: 10 },
  saveButton: { paddingVertical: 16 },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  selector: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectorText: { color: '#fff', fontSize: 15 },
  selectorCaret: { color: '#9CB0D0', fontSize: 18, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#0E1830', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(148,175,230,0.18)', gap: 12 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerModalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  closeText: { color: '#5D89FF', fontWeight: '800' },
  optionRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(148,175,230,0.12)' },
  optionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});