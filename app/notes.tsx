import React, { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { GradientShell, GlassCard, PrimaryButton } from '@/components';
import { ScreenShell } from '@/screen-shell';
import { CrudModal } from '@/crud-modal';
import { apiGet, apiGetWithQuery } from '@/api';
import { createItem, deleteItem, updateItem } from '@/api-hooks';
import { showError } from '@/toast';
import { pickAttachment, pickImage, uploadToSupabase } from '@/storage';
import { SortFilterBar } from '@/filters';

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
    <ScreenShell title="Notes">
    <GradientShell>
      <View style={styles.header}>
        <PrimaryButton title="New Note" icon="add" onPress={openCreate} />
      </View>

      <GlassCard style={styles.searchCard}>
        <TextInput value={query} onChangeText={runSearch} placeholder="Search notes..." placeholderTextColor="#7E92B9" style={styles.searchInput} />
      </GlassCard>
      <SortFilterBar sort={sort} setSort={setSort} order={order} setOrder={setOrder} filters={filters} setFilters={setFilters} />

      <View style={styles.uploadRow}>
        <PrimaryButton
          title="Upload File"
          variant="ghost"
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
        />
        <PrimaryButton
          title="Upload Image"
          variant="ghost"
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
        />
      </View>
      {uploading || loading || searching ? <ActivityIndicator color="#fff" /> : null}

      <FlatList
        data={visibleItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, false)} tintColor="#fff" />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No notes yet.</Text> : null}
        onEndReached={() => { if (hasMore && !loading && !refreshing && !query.trim()) load(page + 1, true); }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{item.title}</Text>
              <Pressable onPress={() => openEdit(item)}><Text style={styles.editLink}>Edit</Text></Pressable>
            </View>
            <Text style={styles.sub} numberOfLines={3}>{item.content}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.meta}>{new Date(item.created_at ?? item.createdAt ?? Date.now()).toLocaleDateString()}</Text>
              <Pressable onPress={async () => { await remove(item); }}><Text style={styles.deleteLink}>Delete</Text></Pressable>
            </View>
            <View style={styles.attachRow}>
              {(Array.isArray(item.attachments) ? item.attachments : String(item.attachments ?? '').split(',').map((v) => v.trim()).filter(Boolean)).slice(0, 3).map((attachment: string) => (
                <View key={attachment} style={styles.attachPill}><Text style={styles.attachText} numberOfLines={1}>{attachment}</Text></View>
              ))}
            </View>
          </GlassCard>
        )}
      />

      <CrudModal visible={!!mode} title={mode === 'edit' ? 'Edit Note' : 'New Note'} fields={fields} values={draft} onChange={setDraft} onClose={() => setMode(null)} onSubmit={submit} />
    </GradientShell>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { padding: 14, gap: 12 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  searchCard: { marginHorizontal: 14, padding: 12 },
  searchInput: { color: '#fff', minHeight: 48 },
  uploadRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  list: { padding: 14, gap: 12, paddingBottom: 20 },
  card: { padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: '900', flex: 1, paddingRight: 12 },
  sub: { color: '#B2C3E1', lineHeight: 22 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#8DA3C7', fontSize: 12, fontWeight: '700' },
  editLink: { color: '#86A8FF', fontWeight: '800' },
  deleteLink: { color: '#FF6B6B', fontWeight: '800' },
  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachPill: { backgroundColor: '#132545', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  attachText: { color: '#D8E6FF', fontSize: 11, fontWeight: '700' },
  empty: { color: '#A6B7D7', paddingHorizontal: 14 },
});
