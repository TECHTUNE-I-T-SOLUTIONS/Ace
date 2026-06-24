import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
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
          <Pressable onPress={uploadAvatar} style={styles.avatar}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={38} color="#EAF1FF" />}
          </Pressable>
          {uploading ? <ActivityIndicator color="#fff" /> : null}
          <Text style={styles.name}>{labelOr(profile?.full_name, 'Complete your profile')}</Text>
          <Text style={styles.meta}>{labelOr(profile?.student_id, 'Student ID not set')}</Text>
          <Text style={styles.meta}>
            {labelOr(profile?.institution, 'Institution not set')} • {labelOr(profile?.faculty, 'Faculty not set')}
          </Text>
          <Text style={styles.meta}>
            {labelOr(profile?.department, 'Department not set')} • {profile?.level ? `Level ${profile.level}` : 'Level not set'}
          </Text>
          <Text style={styles.meta}>{labelOr(profile?.email, 'Email not set')}</Text>
          <PrimaryButton title="Update Photo" variant="light" onPress={uploadAvatar} />
        </View>

        <GlassCard style={styles.rowCard}>
          <View style={styles.statRow}>
            <Stat label="Courses" value={String(profile?.courses_count ?? 0)} />
            <Stat label="Assignments" value={String(profile?.assignments_count ?? 0)} />
            <Stat label="GPA" value={profile?.gpa ? String(profile.gpa) : 'N/A'} />
          </View>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.section}>Academic Information</Text>
          <Field label="Institution" value={labelOr(profile?.institution, 'Not set')} />
          <Field label="Faculty" value={labelOr(profile?.faculty, 'Not set')} />
          <Field label="Department" value={labelOr(profile?.department, 'Not set')} />
          <Field label="Level" value={labelOr(profile?.level, 'Not set')} />
          <Field label="Student ID" value={labelOr(profile?.student_id, 'Not set')} />
          <Field label="Email" value={labelOr(profile?.email, 'Not set')} />
        </GlassCard>
      </ScrollView>
    </GradientShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text style={styles.item}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 20, paddingTop: 16 },
  hero: { backgroundColor: '#2A61D9', borderRadius: 28, padding: 20, alignItems: 'center', gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 6, overflow: 'hidden' },
  avatarImage: { width: 96, height: 96 },
  name: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  meta: { color: '#E7EEFF', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  rowCard: { padding: 14 },
  statRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#A8BAD9', fontSize: 11, fontWeight: '700' },
  infoCard: { padding: 16, gap: 4 },
  section: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  item: { color: '#A7B9D8', fontSize: 11, fontWeight: '800', marginTop: 10, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
