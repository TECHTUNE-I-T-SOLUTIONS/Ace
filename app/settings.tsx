import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { apiGet, apiJson } from '../src/api';
import { showError, showSuccess } from '../src/toast';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet('/settings').then((data:any)=>setSettings(data.data ?? data)).catch((e)=>showError(e.message)).finally(()=>setLoading(false)); }, []);
  const toggle = async (key: string) => { const next = { ...settings, [key]: !settings?.[key] }; await apiJson('/settings', 'PATCH', next); setSettings(next); showSuccess('Updated settings'); };
  return (<ScreenShell title="Settings"><GradientShell>{loading ? <ActivityIndicator color="#fff" /> : null}<GlassCard style={styles.card}><Row label="Notifications" value={!!settings?.notifications_enabled} onPress={() => toggle('notifications_enabled')} /><Row label="Study Reminders" value={!!settings?.study_reminders} onPress={() => toggle('study_reminders')} /></GlassCard></GradientShell></ScreenShell>);
}
function Row({ label, value, onPress }: any) { return <Pressable onPress={onPress} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value ? 'On' : 'Off'}</Text></Pressable>; }
const styles = StyleSheet.create({ title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, card:{margin:14,padding:14,gap:14}, row:{flexDirection:'row',justifyContent:'space-between'}, label:{color:'#fff',fontWeight:'800'}, value:{color:'#86A8FF',fontWeight:'800'} });
