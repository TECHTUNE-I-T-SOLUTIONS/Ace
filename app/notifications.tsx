import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientShell, GlassCard } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { useCrudList, updateItem } from '@/api-hooks';
import { SortFilterBar } from '@/filters';

export default function NotificationsScreen() {
  const { items, loading, refresh } = useCrudList<any>('/notifications');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  return (
    <ScreenShell title="Notifications">
    <GradientShell>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
      {loading ? <ActivityIndicator color="#fff" /> : null}
      <FlatList data={items} keyExtractor={(i)=>i.id} contentContainerStyle={styles.list} renderItem={({item})=><GlassCard style={styles.card}><Text style={styles.name}>{item.title}</Text><Text style={styles.sub}>{item.body}</Text><Pressable onPress={async()=>{ await updateItem(`/notifications/${item.id}`, { is_read: true }); await refresh(); }}><Text style={styles.action}>{item.is_read ? 'Read' : 'Mark as read'}</Text></Pressable></GlassCard>} />
    </GradientShell>
    </ScreenShell>
  );
}
const styles = StyleSheet.create({ title:{color:'#fff',fontSize:30,fontWeight:'900',padding:14}, list:{padding:14,gap:12}, card:{padding:14,gap:8}, name:{color:'#fff',fontSize:18,fontWeight:'900'}, sub:{color:'#B2C3E1'}, action:{color:'#86A8FF',fontWeight:'800'} });
