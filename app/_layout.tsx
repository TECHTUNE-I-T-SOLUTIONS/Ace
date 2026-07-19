import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth-context';
import { ThemeProvider, useTheme } from '@/theme-context';
import { Toast } from '@/toast';
import { View } from 'react-native';

function RootLayoutInner() {
  const { mode } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: mode === 'dark' ? '#050F1D' : '#E8EEF8' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="courses" />
        <Stack.Screen name="assignments" />
        <Stack.Screen name="tests" />
        <Stack.Screen name="exams" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="diary-details" />
        <Stack.Screen name="edit" />
      </Stack>
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutInner />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}