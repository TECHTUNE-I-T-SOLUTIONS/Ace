import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { apiGet } from '../src/api';
import { showError } from '../src/toast';

export default function AuditLogsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet('/audit-logs').then((data:any)=>setItems(data.data ?? data)).catch((e)=>showError(e.message)).finally(()=>setLoading(false)); }, []);
  return (<ScreenShell title="Audit Logs"><GradientShell>{loading ? <ActivityIndicator color="#fff" /> : null}<FlatList data={items} keyExtractor={(i)=>i.id} contentContainerStyle={styles.list} renderItem={({item})=><GlassCard style={styles.card}><Text style={styles.name}>{item.table_name}</Text><Text style={styles.sub}>{item.action}</Text><Text style={styles.body} numberOfLines={3}>{JSON.stringify(item.payload)}</Text></GlassCard>} /></GradientShell></ScreenShell>);
}
const styles = StyleSheet.create({ title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, list:{padding:14,gap:12}, card:{padding:14,gap:8}, name:{color:'#fff',fontWeight:'900'}, sub:{color:'#86A8FF'}, body:{color:'#B2C3E1'} });
