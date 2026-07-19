import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radii } from '@/theme';
import { useColors } from '@/theme';

export function GradientShell({ children, style, safe = true }: { children: React.ReactNode; style?: any; safe?: boolean }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return (
    <View style={[styles.shell, { backgroundColor: colors.backgroundDeep }, style, safe && { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
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
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid' && { backgroundColor: colors.primary },
        variant === 'ghost' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
        variant === 'light' && { backgroundColor: '#F8FAFF' },
        pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'solid' && { color: colors.primary }]}>{title}</Text>
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
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: '#DCE6FA' }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: '#101F39', borderColor: colors.border }]}>
        <Ionicons name={secureTextEntry ? 'lock-closed-outline' : 'mail-outline'} size={18} color={colors.muted} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#7E92B9"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  card: {
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
  buttonSolid: {},
  buttonGhost: {},
  buttonLight: {},
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  inputWrap: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15 },
});