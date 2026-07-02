import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { apiGet, apiJson } from '../src/api';
import { showError, showSuccess } from '../src/toast';
import { usePushTokenManager } from '../src/use-push-token';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { registerToken } = usePushTokenManager();

  useEffect(() => {
    apiGet('/settings').then((data:any)=>setSettings(data.data ?? data)).catch((e)=>showError(e.message)).finally(()=>setLoading(false));
  }, []);

  const toggle = async (key: string) => {
    try {
      setToggling(key);
      const next = { ...settings, [key]: !settings?.[key] };
      await apiJson('/settings', 'PATCH', next);
      setSettings(next);
      
      // If enabling notifications, register push token
      if (key === 'notifications_enabled' && next[key]) {
        const registered = await registerToken();
        if (!registered) {
          showError('Failed to enable push notifications. Please grant notification permission.');
          // Revert the setting
          const reverted = { ...next, [key]: false };
          await apiJson('/settings', 'PATCH', reverted);
          setSettings(reverted);
          return;
        }
      }
      
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
