import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientShell, PrimaryButton } from '@/components';
import { apiGet, apiJson } from '@/api';
import { showError, showSuccess } from '@/toast';
import { colors } from '@/theme';

export default function EditScreen() {
  const params = useLocalSearchParams<{ type: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiGet<any>(`/${params.type}s/${params.id}`);
      setData(result);
      setForm(result);
    } catch (error: any) {
      showError(error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiJson(`/${params.type}s/${params.id}`, 'PATCH', form);
      showSuccess('Updated successfully');
      router.back();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(false);
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
    return null;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={() => router.back()}>
      <GradientShell>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Edit {params.type}</Text>
          </View>

          <View style={styles.form}>
            {Object.entries(data).map(([key, value]: [string, any]) => {
              if (key === 'id' || key === 'user_id' || key === 'userId' || key === 'created_at' || key === 'updatedAt') {
                return null;
              }
              
              const isLongText = key === 'content' || key === 'description' || key === 'notes';
              
              return (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{formatLabel(key)}</Text>
                  {isLongText ? (
                    <TextInput
                      value={String(form[key] ?? '')}
                      onChangeText={(text) => setForm((current) => ({ ...current, [key]: text }))}
                      placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                      placeholderTextColor="#7E92B9"
                      style={[styles.formInput, styles.textArea]}
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <TextInput
                      value={String(form[key] ?? '')}
                      onChangeText={(text) => setForm((current) => ({ ...current, [key]: text }))}
                      placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                      placeholderTextColor="#7E92B9"
                      style={styles.formInput}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title={saving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
            />
            <Pressable onPress={() => router.back()} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </GradientShell>
    </Modal>
  );
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1 },
  form: { gap: 16 },
  formGroup: { gap: 8 },
  formLabel: { color: '#B7C7E7', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  formInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  actions: { gap: 12, marginTop: 10 },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
});