import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { useAuth } from '@/auth-context';

export default function SplashScreen() {
  const scale = React.useRef(new Animated.Value(0.92)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const { user, ready } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (ready && user) {
        // User already has an active session - go straight to dashboard
        router.replace('/(tabs)/dashboard');
      } else if (ready) {
        // No session - go to onboarding
        router.replace('/onboarding');
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [ready, user]);

  return (
    <View style={styles.screen}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }], opacity }}>
        <View style={styles.logoRing}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>ACE</Text>
        <Text style={styles.subtitle}>Schedule Smarter. Study Better.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#214FCE', alignItems: 'center', justifyContent: 'center' },
  logoRing: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 102, height: 102, tintColor: '#DCE6FF' },
  title: { marginTop: 18, color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  subtitle: { marginTop: 6, color: '#E9F0FF', fontSize: 14, fontWeight: '600' },
});