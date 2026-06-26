import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientShell, GlassCard } from '../src/components';
import { ScreenShell } from '../src/screen-shell';
import { colors } from '../src/theme';
import { useCrudList, updateItem } from '../src/api-hooks';
import { SortFilterBar } from '../src/filters';

export default function NotificationsScreen() {
  const { items, loading, refreshing, refresh } = useCrudList<any>('/notifications');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);

  const markAllRead = async () => {
    const unread = items.filter((n: any) => !n.is_read);
    for (const n of unread) {
      await updateItem(`/notifications/${n.id}`, { is_read: true });
    }
    await refresh();
  };

  return (
    <ScreenShell 
      title="Notifications"
      rightAction={
        items.some((n: any) => !n.is_read) && (
          <Pressable onPress={markAllRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </Pressable>
        )
      }
    >
      <View style={styles.container}>
        <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />
        
        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList 
            data={items} 
            keyExtractor={(i) => i.id} 
            contentContainerStyle={styles.list} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
            ListEmptyComponent={<Text style={styles.empty}>No notifications to show.</Text>}
            renderItem={({ item }) => (
              <GlassCard style={[styles.card, item.is_read && styles.readCard]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.notifIcon, { backgroundColor: item.is_read ? colors.surfaceSoft : colors.primary + '20' }]}>
                    <Ionicons 
                      name={getNotifIcon(item.type)} 
                      size={20} 
                      color={item.is_read ? colors.muted : colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, item.is_read && styles.readText]}>{item.title}</Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                
                <Text style={[styles.sub, item.is_read && styles.readText]}>{item.body}</Text>
                
                {!item.is_read && (
                  <Pressable 
                    onPress={async () => { await updateItem(`/notifications/${item.id}`, { is_read: true }); await refresh(); }}
                    style={styles.markBtn}
                  >
                    <Text style={styles.markBtnText}>Mark as read</Text>
                  </Pressable>
                )}
              </GlassCard>
            )} 
          />
        )}
      </View>
    </ScreenShell>
  );
}

function getNotifIcon(type: string) {
  switch (type) {
    case 'assignment': return 'document-text-outline';
    case 'exam': return 'school-outline';
    case 'announcement': return 'megaphone-outline';
    default: return 'notifications-outline';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markReadBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  markReadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { padding: 16, gap: 12, borderRadius: 20 },
  readCard: { opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.02)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  readText: { color: colors.muted },
  date: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  sub: { color: '#B2C3E1', fontSize: 14, lineHeight: 20 },
  markBtn: { alignSelf: 'flex-start', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.primary },
  markBtnText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
