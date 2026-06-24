import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AppInput, GradientShell, PrimaryButton } from '@/components';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/toast';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = async () => {
    try {
      if (!supabase) throw new Error('Supabase is not configured yet.');
      // Validation
      if (!fullName.trim()) throw new Error('Full name is required');
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) throw new Error('Invalid email address');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      // Success navigation
      router.replace('/(auth)/register-success');
    } catch (error: any) {
      showError(error?.message ?? 'Unable to create account');
    }
  };

  return (
    <GradientShell style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join ACE and start organizing your semester.</Text>
        <View style={styles.form}>
          <AppInput label="Full Name" placeholder="John Doe" value={fullName} onChangeText={setFullName} />
          <AppInput label="Email Address" placeholder="student@university.edu" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <View style={styles.passwordContainer}>
            <AppInput
              label="Password"
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <PrimaryButton title="Create Account" onPress={handleCreate} />
          <PrimaryButton title="Back to Login" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#AFC0DF', fontSize: 14, marginBottom: 10 },
  form: { gap: 14 },
  passwordContainer: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: 12, top: 40 },
});
