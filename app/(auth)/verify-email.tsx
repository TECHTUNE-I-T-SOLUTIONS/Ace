import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GradientShell, PrimaryButton } from '@/components';
import { router } from 'expo-router';

export default function VerifyEmail() {
  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.text}>We sent a verification link. Open your inbox and confirm your account before logging in.</Text>
          <PrimaryButton title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </ScrollView>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#101F39', borderRadius: 24, padding: 18, gap: 14, borderWidth: 1, borderColor: 'rgba(148,175,230,0.18)' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  text: { color: '#B5C6E2', lineHeight: 22 },
});
