import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onboardingSlides } from '@/data';
import { colors, radii } from '@/theme';
import { PrimaryButton } from '@/components';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];

  const dotRow = useMemo(() => onboardingSlides.map((_, i) => i), []);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={[styles.heroIcon, { backgroundColor: slide.accent }]}>
          <Ionicons name={slide.icon as any} size={50} color="#fff" />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.description}</Text>

        <View style={styles.dots}>
          {dotRow.map((i) => <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)}
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Skip" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
          <PrimaryButton
            title={index === 2 ? 'Get Started' : 'Next'}
            icon="chevron-forward"
            onPress={() => (index === 2 ? router.replace('/(auth)/login') : setIndex((v) => v + 1))}
          />
        </View>
      </View>
      <View style={styles.previewStrip}>
        <Image source={require('../assets/logo.png')} style={styles.previewLogo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050F1D', padding: 12, justifyContent: 'center' },
  card: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#0B1324',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 26,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroIcon: { width: 126, height: 126, borderRadius: 63, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 32, maxWidth: width * 0.76 },
  desc: { color: '#B2C1E0', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: width * 0.78 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#25314B' },
  dotActive: { width: 22, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 18 },
  previewStrip: { position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center' },
  previewLogo: { width: 74, height: 74, opacity: 0.08 },
});
