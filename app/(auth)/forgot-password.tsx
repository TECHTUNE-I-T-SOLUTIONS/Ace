import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppInput, GradientShell, PrimaryButton } from '@/components';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/toast';

export default function ForgotPassword() {
  const handleReset = async () => {
    try {
      if (!supabase) throw new Error('Supabase is not configured yet.');
      const { error } = await supabase.auth.resetPasswordForEmail('student@university.edu');
      if (error) throw error;
      showSuccess('Reset link sent');
    } catch (error: any) {
      showError(error?.message ?? 'Unable to send reset link');
    }
  };

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>We’ll send a reset link to your email address.</Text>
        <View style={styles.form}>
          <AppInput label="Email Address" placeholder="student@university.edu" />
          <PrimaryButton title="Send Reset Link" onPress={handleReset} />
        </View>
      </ScrollView>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 16, justifyContent: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#AFC0DF', fontSize: 14, marginBottom: 10 },
  form: { gap: 14 },
});
