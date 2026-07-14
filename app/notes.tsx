import React, { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientShell, GlassCard, PrimaryButton } from '../src/components';
import { colors } from '../src/theme';
import { ScreenShell } from '../src/screen-shell';
import { CrudModal } from '../src/crud-modal';
import { apiGet, apiGetWithQuery } from '../src/api';
import { createItem, deleteItem, updateItem } from '../src/api-hooks';
import { showError } from '../src/toast';
import { pickAttachment, pickImage, uploadToSupabase } from '../src/storage';
import { SortFilterBar } from '../src/filters';
import { formatDate } from '../src/utils/date-utils';

export default function NotesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fields = useMemo(() => [
    { key: 'title', label: 'Title', placeholder: 'Lecture Notes' },
    { key: 'content', label: 'Content', placeholder: 'Write your note...', multiline: true },
    { key: 'summary', label: 'Summary', placeholder: 'Short summary', multiline: true },
  ], []);

  const load = async (nextPage = 1, append = false) => {
    try {
      if (nextPage === 1) setLoading(true); else setRefreshing(true);
      const res: any = await apiGetWithQuery('/notes', { page: nextPage, limit: 20, sortBy: sort, order, filters: filters.join(',') || undefined, search: query.trim() || undefined });
      const rows = res.data ?? res ?? [];
      setItems((current) => append ? [...current, ...rows] : rows);
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch (error: any) {
      showError(error.message ?? 'Failed to load notes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, false); }, [sort, order, filters]);

  const openCreate = () => { setSelected(null); setDraft({ title: '', content: '', summary: '', attachments: '' }); setMode('create'); };
  const openEdit = (item: any) => { setSelected(item); setDraft({ title: item.title ?? '', content: item.content ?? '', summary: item.summary ?? '', attachments: Array.isArray(item.attachments) ? item.attachments.join(', ') : item.attachments ?? '' }); setMode('edit'); };
  const submit = async () => { const payload = { ...draft, attachments: draft.attachments ? draft.attachments.split(',').map((v) => v.trim()).filter(Boolean) : [] }; if (mode === 'create') await createItem('/notes', payload); if (mode === 'edit' && selected) await updateItem(`/notes/${selected.id}`, payload); setMode(null); await load(1, false); };
  const remove = async (item: any) => { await deleteItem(`/notes/${item.id}`); await load(1, false); };

  const runSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) return setSearchResults([]);
    setSearching(true);
    try {
      const res: any = await apiGet(`/notes/search?q=${encodeURIComponent(value)}`);
      setSearchResults(res.data ?? res ?? []);
    } catch (error: any) {
      showError(error.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const visibleItems = query.trim() ? searchResults : items;

  return (
    <ScreenShell title="My Notes">
      <View style={styles.header}>
        <PrimaryButton title="Create New Note" icon="add" onPress={openCreate} />
      </View>

      <GlassCard style={styles.searchCard}>
        <Ionicons name="search-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput value={query} onChangeText={runSearch} placeholder="Search your notes..." placeholderTextColor="#7E92B9" style={styles.searchInput} />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />

      {uploading || loading || searching ? <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} /> : null}

      <FlatList
        data={visibleItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No notes found yet.</Text> : null}
        onEndReached={() => { if (hasMore && !loading && !refreshing && !query.trim()) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push({ pathname: '/details', params: { type: 'note', id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          >
            <GlassCard style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={(e) => { e.stopPropagation(); openEdit(item); }}><Ionicons name="pencil" size={18} color={colors.primary} /></Pressable>
                  <Pressable onPress={async (e) => { e.stopPropagation(); await remove(item); }}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                </View>
              </View>
              
              <Text style={styles.sub} numberOfLines={2}>{item.summary || item.content}</Text>
              
              <View style={styles.footerRow}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                  <Text style={styles.meta}>{formatDate(item.created_at ?? item.createdAt)}</Text>
                </View>
                
                <View style={styles.attachRow}>
                  {(Array.isArray(item.attachments) ? item.attachments : String(item.attachments ?? '').split(',').map((v) => v.trim()).filter(Boolean)).length > 0 && (
                    <View style={styles.attachCount}>
                      <Ionicons name="attach-outline" size={14} color={colors.success} />
                      <Text style={styles.attachCountText}>{(Array.isArray(item.attachments) ? item.attachments : String(item.attachments ?? '').split(',').map((v) => v.trim()).filter(Boolean)).length}</Text>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          </Pressable>
        )}
      />

      <CrudModal 
        visible={!!mode} 
        title={mode === 'edit' ? 'Edit Note' : 'New Note'} 
        fields={fields} 
        values={draft} 
        onChange={setDraft} 
        onClose={() => setMode(null)} 
        onSubmit={submit}
        customActions={
          <View style={styles.uploadButtons}>
            <Pressable 
              onPress={async () => {
                setUploading(true);
                try {
                  const assets = await pickAttachment();
                  const uploaded: string[] = [];
                  for (const asset of assets) {
                    const url = await uploadToSupabase('attachments', asset.uri, `notes/${Date.now()}-${asset.name ?? 'file'}`);
                    uploaded.push(url);
                  }
                  setDraft((current) => ({ ...current, attachments: [...(current.attachments ? current.attachments.split(',').map((v) => v.trim()).filter(Boolean) : []), ...uploaded].join(', ') }));
                } catch (error: any) {
                  showError(error.message ?? 'Upload failed');
                } finally {
                  setUploading(false);
                }
              }}
              style={styles.uploadBtn}
            >
              <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
              <Text style={styles.uploadBtnText}>File</Text>
            </Pressable>
            <Pressable 
              onPress={async () => {
                setUploading(true);
                try {
                  const asset = await pickImage();
                  if (!asset) return;
                  const url = await uploadToSupabase('attachments', asset.uri, `notes/${Date.now()}-${asset.fileName ?? 'image'}`);
                  setDraft((current) => ({ ...current, attachments: [...(current.attachments ? current.attachments.split(',').map((v) => v.trim()).filter(Boolean) : []), url].join(', ') }));
                } catch (error: any) {
                  showError(error.message ?? 'Upload failed');
                } finally {
                  setUploading(false);
                }
              }}
              style={styles.uploadBtn}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Image</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 14, marginBottom: 10 },
  uploadButtons: { flexDirection: 'row', gap: 10 },
  uploadBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: 'rgba(61, 124, 255, 0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(61, 124, 255, 0.2)' },
  uploadBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  searchCard: { marginHorizontal: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', minHeight: 52, marginBottom: 20 },
  searchInput: { color: '#fff', flex: 1, fontSize: 15 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { padding: 20, gap: 12, borderRadius: 24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 20, fontWeight: '900', flex: 1, paddingRight: 12 },
  cardActions: { flexDirection: 'row', gap: 16 },
  sub: { color: '#B2C3E1', lineHeight: 22, fontSize: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  meta: { color: '#8DA3C7', fontSize: 12, fontWeight: '700' },
  attachRow: { flexDirection: 'row', gap: 8 },
  attachCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  attachCountText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  empty: { color: '#A6B7D7', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
