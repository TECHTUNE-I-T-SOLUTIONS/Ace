import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { apiJson } from '@/api';
import { showError, showSuccess } from '@/toast';
import { colors } from '@/theme';
import { useAuth } from '@/auth-context';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ type: string; id: string }>();
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://ace-dst7.onrender.com/api';
      const response = await fetch(`${API_BASE}/details?type=${params.type}&id=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load details');
      const result = await response.json();
      setData(result);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiJson(`/${params.type}s/${params.id}`, 'DELETE');
      showSuccess('Deleted successfully');
      router.back();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <GradientShell>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GradientShell>
    );
  }

  if (!data) {
    return (
      <GradientShell>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load details</Text>
          <PrimaryButton title="Go Back" onPress={() => router.back()} />
        </View>
      </GradientShell>
    );
  }

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{getTitle(params.type)}</Text>
        </View>

        <GlassCard style={styles.detailsCard}>
          <View style={styles.typeHeader}>
            <View style={[styles.typeIcon, { backgroundColor: getTypeColor(params.type) + '20' }]}>
              <Ionicons name={getTypeIcon(params.type)} size={28} color={getTypeColor(params.type)} />
            </View>
            <Text style={styles.typeLabel}>{params.type.toUpperCase()}</Text>
          </View>

          <View style={styles.fieldsContainer}>
            {Object.entries(data).map(([key, value]: [string, any]) => {
              if (key === 'id' || key === 'user_id' || key === 'userId') return null;
              return (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{formatLabel(key)}</Text>
                  <Text style={styles.fieldValue}>{formatValue(value)}</Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        <View style={styles.actions}>
          <View style={styles.editButton}>
            <PrimaryButton
              title="Edit"
              icon="pencil-outline"
              onPress={() => router.push({ pathname: '/edit', params: { type: params.type, id: params.id } })}
            />
          </View>
          <Pressable onPress={handleDelete} disabled={deleting} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </GradientShell>
  );
}

function getTitle(type: string): string {
  switch (type) {
    case 'course': return 'Course Details';
    case 'assignment': return 'Assignment Details';
    case 'test': return 'Test Details';
    case 'exam': return 'Exam Details';
    case 'task': return 'Task Details';
    case 'grade': return 'Grade Details';
    case 'attendance': return 'Attendance Details';
    case 'note': return 'Note Details';
    case 'study': return 'Study Session Details';
    case 'diary': return 'Diary Entry Details';
    default: return 'Details';
  }
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'course': return 'book';
    case 'assignment': return 'document-text';
    case 'test': return 'flask';
    case 'exam': return 'school';
    case 'task': return 'checkmark-circle';
    case 'grade': return 'medal';
    case 'attendance': return 'calendar';
    case 'note': return 'document';
    case 'study': return 'time';
    case 'diary': return 'journal';
    default: return 'information-circle';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'course': return '#3D7CFF';
    case 'assignment': return '#B14CFF';
    case 'test': return '#F59E0B';
    case 'exam': return '#FF5C62';
    case 'task': return '#10C06D';
    case 'grade': return '#23B7FF';
    case 'attendance': return '#6F5DFF';
    case 'note': return '#FFD700';
    case 'study': return '#10C06D';
    case 'diary': return '#B14CFF';
    default: return '#3D7CFF';
  }
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 16, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1 },
  detailsCard: { padding: 20, gap: 16 },
  typeHeader: { alignItems: 'center', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  typeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  fieldsContainer: { gap: 16 },
  fieldRow: { gap: 8 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fieldValue: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editButton: { flex: 1 },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, paddingVertical: 16, borderRadius: 14 },
  deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});