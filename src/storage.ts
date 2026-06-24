import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

export async function pickAttachment() {
  const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: ['image/*', 'application/*', 'text/*'] });
  if (result.canceled) return [];
  return result.assets;
}

export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Media library permission denied');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'] as any,
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled) return null;
  return result.assets[0];
}

export async function uploadToSupabase(bucket: string, uri: string, path: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const blob = new Blob([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))]);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type || (bucket === 'avatars' ? 'image/jpeg' : 'application/octet-stream'),
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function storagePath(bucketFolder: string, fileName: string, userId?: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId ?? 'anonymous'}/${bucketFolder}/${Date.now()}-${safeName}`;
}
