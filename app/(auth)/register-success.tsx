import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GradientShell, PrimaryButton } from '@/components';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterSuccess() {
  // Auto‑navigate to login after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GradientShell style={{ flex: 1 }}>
      <View style={styles.container}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.title}>Account Created!</Text>
        <Text style={styles.message}>Your account has been successfully created. You will be redirected to login.</Text>
        <PrimaryButton title="Go to Login" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
      </View>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
  },
  message: {
    color: '#AFC0DF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
});
