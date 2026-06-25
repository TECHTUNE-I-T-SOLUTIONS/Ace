import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { colors } from '@/theme';
import { apiGet } from '@/api';
import { showError } from '@/toast';
import { pickImage, storagePath, uploadToSupabase } from '@/storage';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiGet<any>('/users/me')
      .then(setProfile)
      .catch((error) => showError(error.message))
      .finally(() => setLoading(false));
  }, []);

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
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
            <Text style={styles.statValue}>{profile?.courses_count ?? 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.assignments_count ?? 0}</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.gpa || '0.0'}</Text>
            <Text style={styles.statLabel}>GPA</Text>
          </GlassCard>
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

        <PrimaryButton title="Edit Profile Details" variant="ghost" icon="create-outline" />
      </ScrollView>
    </GradientShell>
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
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 4 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  infoCard: { padding: 20, gap: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  fieldList: { gap: 18 },
  fieldItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  fieldValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
