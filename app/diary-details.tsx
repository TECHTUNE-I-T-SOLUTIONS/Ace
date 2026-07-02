import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { apiGet, apiJson } from '@/api';
import { showError, showSuccess } from '@/toast';
import { colors } from '@/theme';

export default function DiaryDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: 'neutral',
  });

  useEffect(() => {
    loadEntry();
  }, []);

  const loadEntry = async () => {
    try {
      setLoading(true);
      const result = await apiGet<any>(`/diary/${params.id}`);
      setEntry(result);
      setForm({
        title: result.title ?? '',
        content: result.content ?? '',
        mood: result.mood ?? 'neutral',
      });
    } catch (error: any) {
      showError(error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this diary entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await apiJson(`/diary/${params.id}`, 'DELETE');
              showSuccess('Entry deleted successfully');
              router.replace('/(tabs)/diary');
            } catch (error: any) {
              showError(error.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiJson(`/diary/${params.id}`, 'PATCH', form);
      showSuccess('Entry updated successfully');
      setEditing(false);
      loadEntry();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '😊';
      case 'focused': return '🧠';
      case 'stressed': return '😫';
      default: return '😐';
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

  if (!entry) {
    return null;
  }

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Diary Entry</Text>
        </View>

        <GlassCard style={styles.detailsCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
            <View style={styles.entryTitleContainer}>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryDate}>
                {new Date(entry.created_at ?? entry.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contentSection}>
            <Text style={styles.contentLabel}>Content</Text>
            <Text style={styles.contentText}>{entry.content}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="document-outline" size={16} color={colors.muted} />
              <Text style={styles.statText}>{entry.word_count ?? entry.wordCount ?? 0} words</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
              <Text style={styles.statText}>
                {new Date(entry.created_at ?? entry.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.actions}>
          <View style={styles.editButton}>
            <PrimaryButton
              title="Edit Entry"
              icon="pencil-outline"
              onPress={() => setEditing(true)}
            />
          </View>
          <Pressable 
            onPress={handleDelete} 
            disabled={deleting} 
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <GradientShell>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Entry</Text>
              <Pressable onPress={() => setEditing(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                value={form.title}
                onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
                placeholder="Entry title"
                placeholderTextColor="#7E92B9"
                style={styles.formInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mood</Text>
              <View style={styles.moodSelector}>
                {['happy', 'focused', 'stressed', 'neutral'].map((mood) => (
                  <Pressable
                    key={mood}
                    onPress={() => setForm((current) => ({ ...current, mood }))}
                    style={[styles.moodOption, form.mood === mood && styles.moodOptionActive]}
                  >
                    <Text style={styles.moodEmojiText}>
                      {mood === 'happy' ? '😊' : mood === 'focused' ? '🧠' : mood === 'stressed' ? '😫' : '😐'}
                    </Text>
                    <Text style={[styles.moodText, form.mood === mood && styles.moodTextActive]}>
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Content</Text>
              <TextInput
                value={form.content}
                onChangeText={(text) => setForm((current) => ({ ...current, content: text }))}
                placeholder="Write your thoughts..."
                placeholderTextColor="#7E92B9"
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={8}
              />
            </View>

            <View style={styles.modalActions}>
              <View style={styles.saveButton}>
                <PrimaryButton
                  title={saving ? 'Saving...' : 'Save Changes'}
                  onPress={handleSave}
                />
              </View>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </GradientShell>
      </Modal>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1 },
  detailsCard: { padding: 20, gap: 16 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  moodEmoji: { fontSize: 40 },
  entryTitleContainer: { flex: 1 },
  entryTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  entryDate: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  contentSection: { gap: 8 },
  contentLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  contentText: { color: '#B1C1E0', fontSize: 15, lineHeight: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  statText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editButton: { flex: 1 },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, paddingVertical: 16, borderRadius: 14 },
  deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalContent: { padding: 20, gap: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  formGroup: { gap: 8 },
  formLabel: { color: '#B7C7E7', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  formInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  moodSelector: { flexDirection: 'row', gap: 8 },
  moodOption: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 6 },
  moodOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  moodEmojiText: { fontSize: 24 },
  moodText: { color: '#B7C7E7', fontWeight: '800', fontSize: 12 },
  moodTextActive: { color: '#fff' },
  modalActions: { gap: 12, marginTop: 10 },
  saveButton: { paddingVertical: 16 },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
});