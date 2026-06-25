import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '@/theme';

export function GradientShell({ children, style, safe = true }: { children: React.ReactNode; style?: any; safe?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.shell, style, safe && { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'solid',
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'solid' | 'ghost' | 'light';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid' && styles.buttonSolid,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'light' && styles.buttonLight,
        pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'solid' && styles.buttonTextDark]}>{title}</Text>
      {icon ? <Ionicons name={icon} size={18} color={variant === 'solid' ? '#fff' : colors.primary} /> : null}
    </Pressable>
  );
}

export function AppInput({
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={secureTextEntry ? 'lock-closed-outline' : 'mail-outline'} size={18} color={colors.muted} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#7E92B9"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.backgroundDeep },
  card: {
    backgroundColor: 'rgba(16, 29, 51, 0.96)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
  },
  buttonSolid: { backgroundColor: colors.primary },
  buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonLight: { backgroundColor: '#F8FAFF' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonTextDark: { color: colors.primary },
  label: { color: '#DCE6FA', fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  inputWrap: {
    backgroundColor: '#101F39',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
});
