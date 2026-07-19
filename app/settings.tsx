import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { apiGet, apiJson } from '../src/api';
import { showError, showSuccess } from '../src/toast';
import { useFocusEffect } from '@react-navigation/native';
import { usePushTokenManager } from '../src/use-push-token';
import { useTheme } from '../src/theme-context';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { registerToken } = usePushTokenManager();
  const { mode, colors, toggleTheme } = useTheme();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/settings');
      setSettings((data as any).data ?? data);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSettings();
    }, [])
  );

  const toggle = async (key: string) => {
    try {
      setToggling(key);
      const nextValue = !settings?.[key];
      
      // If enabling notifications, request permission and register push token
      if (key === 'notifications_enabled' && nextValue) {
        const perms: any = await Notifications.getPermissionsAsync();
        
        if (!perms.granted) {
          Alert.alert(
            'Enable Notifications',
            'To receive push notifications, you need to grant permission.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setToggling(null) },
              { 
                text: 'Allow', 
                onPress: async () => {
                  const requested: any = await Notifications.requestPermissionsAsync();
                  if (requested.granted) {
                    await proceedWithToggle(key, nextValue);
                  } else {
                    showError('Notification permission denied');
                    setToggling(null);
                  }
                } 
              }
            ]
          );
          return;
        }
        
        // Permission already granted, register push token
        try {
          const registered = await registerToken();
          if (!registered) {
            showError('Failed to register for push notifications');
            setToggling(null);
            return;
          }
        } catch (error: any) {
          showError(error.message);
          setToggling(null);
          return;
        }
      }
      
      await proceedWithToggle(key, nextValue);
    } catch (error: any) {
      showError(error.message);
      setToggling(null);
    }
  };
  
  const proceedWithToggle = async (key: string, value: boolean) => {
    try {
      const next = { ...settings, [key]: value };
      await apiJson('/settings', 'PATCH', next);
      setSettings(next);
      showSuccess('Updated settings');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setToggling(null);
    }
  };

  return (
    <ScreenShell title="Settings">
      <GradientShell>
        {loading ? <ActivityIndicator color={colors.text} /> : null}
        
        {/* Notification Settings */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Notifications</Text>
          <Row 
            label="Notifications" 
            value={!!settings?.notifications_enabled} 
            onPress={() => toggle('notifications_enabled')}
            disabled={toggling === 'notifications_enabled'}
            colors={colors}
            toggling={toggling === 'notifications_enabled'}
          />
          <Row 
            label="Study Reminders" 
            value={!!settings?.study_reminders} 
            onPress={() => toggle('study_reminders')}
            disabled={toggling === 'study_reminders'}
            colors={colors}
            toggling={toggling === 'study_reminders'}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Display</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
              ios_backgroundColor={colors.muted}
            />
          </View>
        </GlassCard>
      </GradientShell>
    </ScreenShell>
  );
}

function Row({ label, value, onPress, disabled, colors, toggling }: any) { 
  return (
    <Pressable 
      onPress={onPress} 
      style={[styles.row, disabled && styles.rowDisabled]} 
      disabled={disabled}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.value, { color: colors.primary }]}>{value ? 'On' : 'Off'}</Text>
        {toggling ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>
    </Pressable>
  ); 
}

const styles = StyleSheet.create({ 
  title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, 
  card:{margin:14,padding:14,gap:14}, 
  sectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  row:{flexDirection:'row',justifyContent:'space-between', alignItems: 'center', paddingVertical: 8}, 
  rowDisabled:{opacity: 0.5},
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:{fontWeight:'800', fontSize: 15}, 
  value:{fontWeight:'800'} 
});