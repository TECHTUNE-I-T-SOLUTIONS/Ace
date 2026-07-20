import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientShell } from '@/components';
import { colors } from '@/theme';

export default function AttachmentViewerScreen() {
  const params = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const attachmentUrl = params.url || '';

  const getFileType = () => {
    if (!attachmentUrl) return 'unknown';
    const ext = attachmentUrl.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (['txt', 'md'].includes(ext)) return 'text';
    return 'unknown';
  };

  const fileType = getFileType();

  const getFileIcon = () => {
    switch (fileType) {
      case 'image': return 'image-outline';
      case 'pdf': return 'document-text-outline';
      case 'document': return 'document-outline';
      case 'spreadsheet': return 'grid-outline';
      case 'presentation': return 'easel-outline';
      case 'text': return 'document-lock-outline';
      default: return 'attach-outline';
    }
  };

  return (
    <GradientShell>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Attachment</Text>
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
              <Text style={styles.errorTitle}>Failed to load</Text>
              <Text style={styles.errorText}>Unable to display this attachment</Text>
            </View>
          ) : (
            <View style={styles.fileContainer}>
              <View style={styles.fileIconContainer}>
                <Ionicons name={getFileIcon()} size={80} color={colors.primary} />
              </View>
              <Text style={styles.fileType}>{fileType.toUpperCase()}</Text>
              <Text style={styles.fileName}>{attachmentUrl.split('/').pop() || 'Attachment'}</Text>
              
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
                <Text style={styles.infoText}>
                  This attachment needs to be downloaded or opened in a compatible app.
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Pressable 
                  onPress={() => {
                    // In a real app, you would use expo-linking or expo-sharing to open the file
                    // For now, we'll just show an alert
                    Alert.alert(
                      'Open Attachment',
                      'In a production build, this would open the file in a compatible app.',
                      [{ text: 'OK' }]
                    );
                  }}
                  style={styles.openButton}
                >
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.openButtonText}>Open File</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1 },
  content: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  fileContainer: { alignItems: 'center', gap: 16, width: '100%' },
  fileIconContainer: { width: 120, height: 120, borderRadius: 24, backgroundColor: 'rgba(61, 124, 255, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(61, 124, 255, 0.2)' },
  fileType: { color: colors.primary, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  fileName: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, maxWidth: 300, marginTop: 8 },
  infoText: { color: colors.muted, fontSize: 13, lineHeight: 18, flex: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%', maxWidth: 300 },
  openButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14 },
  openButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  errorContainer: { alignItems: 'center', gap: 16 },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 16 },
  errorText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});