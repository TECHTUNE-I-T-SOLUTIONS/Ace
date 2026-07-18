import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { apiGet, apiJson } from '../src/api';
import { showError, showSuccess } from '../src/toast';
import { useFocusEffect } from '@react-navigation/native';
import { usePushTokenManager } from '../src/use-push-token';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { registerToken } = usePushTokenManager();

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
        {loading ? <ActivityIndicator color="#fff" /> : null}
        <GlassCard style={styles.card}>
          <Row 
            label="Notifications" 
            value={!!settings?.notifications_enabled} 
            onPress={() => toggle('notifications_enabled')}
            disabled={toggling === 'notifications_enabled'}
          />
          <Row 
            label="Study Reminders" 
            value={!!settings?.study_reminders} 
            onPress={() => toggle('study_reminders')}
            disabled={toggling === 'study_reminders'}
          />
        </GlassCard>
      </GradientShell>
    </ScreenShell>
  );
}

function Row({ label, value, onPress, disabled }: any) { 
  return (
    <Pressable 
      onPress={onPress} 
      style={[styles.row, disabled && styles.rowDisabled]} 
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ? 'On' : 'Off'}</Text>
    </Pressable>
  ); 
}

const styles = StyleSheet.create({ 
  title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, 
  card:{margin:14,padding:14,gap:14}, 
  row:{flexDirection:'row',justifyContent:'space-between', paddingVertical: 8}, 
  rowDisabled:{opacity: 0.5},
  label:{color:'#fff',fontWeight:'800'}, 
  value:{color:'#86A8FF',fontWeight:'800'} 
});
