import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components';
import { useColors } from '@/theme';

export function SortFilterBar({
  sort,
  setSort,
  order,
  setOrder,
  filters,
  setFilters,
}: {
  sort: string;
  setSort: (v: string) => void;
  order: 'asc' | 'desc';
  setOrder: (v: 'asc' | 'desc') => void;
  filters: string[];
  setFilters: (v: string[]) => void;
}) {
  const colors = useColors();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const sortOptions = [
    { key: 'created_at', label: 'Date Created' },
    { key: 'title', label: 'Title' },
    { key: 'deadline_date', label: 'Deadline' },
    { key: 'course_code', label: 'Course Code' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.key === sort)?.label || sort;
  const currentCategory = filters.length > 0 ? filters[0] : 'all';
  const filterOptions = ['all', 'academic', 'personal', 'urgent'];

  return (
    <GlassCard style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        {/* Sort Dropdown */}
        <Pressable onPress={() => setShowSortModal(true)} style={[styles.dropdown, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.primary} />
          <Text style={[styles.dropdownText, { color: colors.text }]} numberOfLines={1}>{currentSortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>

        {/* Order Toggle */}
        <Pressable onPress={() => setOrder(order === 'asc' ? 'desc' : 'asc')} style={[styles.orderBtn, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
          <Ionicons name={order === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} color={colors.primary} />
        </Pressable>

        {/* Category Filter Dropdown */}
        <Pressable onPress={() => setShowFilterModal(true)} style={[styles.dropdown, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
          <Ionicons name="funnel-outline" size={16} color={colors.primary} />
          <Text style={[styles.dropdownText, { color: colors.text }]} numberOfLines={1}>{currentCategory}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
      </View>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowSortModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
            {sortOptions.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => { setSort(opt.key); setShowSortModal(false); }}
                style={[styles.modalItem, sort === opt.key && { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.modalItemText, { color: colors.text }, sort === opt.key && { color: colors.primary }]}>{opt.label}</Text>
                {sort === opt.key && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowFilterModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Category</Text>
            {filterOptions.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => { setFilters(opt === 'all' ? [] : [opt]); setShowFilterModal(false); }}
                style={[styles.modalItem, currentCategory === opt && { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.modalItemText, { color: colors.text }, currentCategory === opt && { color: colors.primary }]}>{opt}</Text>
                {currentCategory === opt && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, padding: 12, gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 13, fontWeight: '700', flex: 1 },
  orderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 24, padding: 20, borderWidth: 1, gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalItemText: { fontSize: 16, fontWeight: '600' },
});