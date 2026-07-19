import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppInput, GlassCard, GradientShell, PrimaryButton } from '@/components';
import { colors } from '@/theme';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/toast';
import { apiGet } from '@/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!supabase) throw new Error('Supabase is not configured yet.');
      if (!email.trim()) throw new Error('Email address is required.');
      if (!password) throw new Error('Password is required.');

      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const message = error.message?.toLowerCase() ?? '';
        if (message.includes('invalid login credentials')) {
          throw new Error('The email or password is incorrect. If you recently signed up, please verify your email first.');
        }
        throw error;
      }

      const profile: any = await apiGet('/users/me');
      const needsProfile = !profile?.full_name || !profile?.institution || !profile?.department || !profile?.level || !profile?.student_id;
      showSuccess('Signed in');
      router.replace(needsProfile ? '/(auth)/profile-setup' : '/(tabs)/dashboard');
    } catch (error: any) {
      showError(error?.message ?? 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.avatar}>
            <Image source={require('../../assets/logo.png')} style={styles.avatarImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <GlassCard style={styles.form}>
          <AppInput label="Email Address" placeholder="student@university.edu" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <View style={styles.passwordContainer}>
            <AppInput label="Password" placeholder="Enter your password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
            </Pressable>
          </View>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>
          <PrimaryButton title={loading ? 'Signing In...' : 'Sign In'} onPress={handleLogin} />
          <Pressable onPress={() => router.push('/(auth)/register')}><Text style={styles.footerLink}>Don't have an account? Sign Up</Text></Pressable>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}><Text style={styles.footerLink}>Forgot password? Reset it here</Text></Pressable>
        </GlassCard>
      </ScrollView>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 14, paddingBottom: 28, justifyContent: 'center', gap: 16 },
  hero: {
    minHeight: 330,
    backgroundColor: '#2A61D9',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 10,
  },
  back: { position: 'absolute', left: 18, top: 18, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 64, height: 64, tintColor: '#DCE6FF' },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#ECF3FF', fontSize: 15, fontWeight: '600' },
  form: { padding: 16, gap: 14, borderRadius: 28, backgroundColor: 'rgba(16, 29, 51, 0.98)' },
  link: { color: '#5D89FF', fontSize: 13, fontWeight: '700' },
  footerLink: { color: '#DDE8FF', textAlign: 'center', marginTop: 6, fontWeight: '700' },
  passwordContainer: { position: 'relative' },
  eyeButton: { position: 'absolute', right: 14, top: 38, zIndex: 10, padding: 4 },
});
