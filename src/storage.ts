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
  
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Get the current user to include in the path for RLS
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Prepend user ID to path for RLS policy compliance
    const userPath = `${user.id}/${path}`;
    
    const { error } = await supabase.storage.from(bucket).upload(userPath, bytes.buffer, {
      upsert: true,
      contentType: bucket === 'avatars' ? 'image/jpeg' : 'application/octet-stream',
    });
    
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(userPath);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload: ${error.message}`);
  }
}

export function storagePath(bucketFolder: string, fileName: string, userId?: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId ?? 'anonymous'}/${bucketFolder}/${Date.now()}-${safeName}`;
}
