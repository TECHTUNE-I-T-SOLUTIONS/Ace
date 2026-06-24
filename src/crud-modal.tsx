import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { PrimaryButton } from '@/components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export function CrudModal({
  visible,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  fields: Array<{ key: string; label: string; placeholder?: string; secure?: boolean; multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'email-address'; options?: string[]; fieldType?: 'text' | 'date' | 'time' | 'select' }>;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [draft, setDraft] = useState(values);
  const [pickerField, setPickerField] = useState<string | null>(null);
  const currentPicker = fields.find((field) => field.key === pickerField) ?? null;

  useEffect(() => setDraft(values), [values, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color="#fff" /></Pressable>
          </View>
          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.key} style={{ gap: 8 }}>
                <Text style={styles.label}>{field.label}</Text>
                {field.options?.length ? (
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={draft[field.key] ?? ''}
                      onValueChange={(value) => {
                        const next = { ...draft, [field.key]: String(value) };
                        setDraft(next);
                        onChange(next);
                      }}
                      style={styles.picker}
                      dropdownIconColor="#9CB0D0"
                    >
                      <Picker.Item label={field.placeholder ?? 'Select value'} value="" color="#7E92B9" />
                      {field.options.map((option) => <Picker.Item key={option} label={option} value={option} color="#fff" />)}
                    </Picker>
                  </View>
                ) : field.fieldType === 'date' ? (
                  <Pressable onPress={() => setPickerField(field.key)} style={styles.selectInput}>
                    <Text style={styles.selectText}>{draft[field.key] ?? field.placeholder ?? 'Pick a date'}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#9CB0D0" />
                  </Pressable>
                ) : field.fieldType === 'time' ? (
                  <Pressable onPress={() => setPickerField(field.key)} style={styles.selectInput}>
                    <Text style={styles.selectText}>{draft[field.key] ?? field.placeholder ?? 'Pick a time'}</Text>
                    <Ionicons name="time-outline" size={18} color="#9CB0D0" />
                  </Pressable>
                ) : (
                  <TextInput
                    value={draft[field.key] ?? ''}
                    onChangeText={(text) => {
                      const nextText = field.key.includes('time') ? text.replace(/[^0-9:]/g, '').slice(0, 5) : text;
                      const next = { ...draft, [field.key]: nextText };
                      setDraft(next);
                      onChange(next);
                    }}
                    placeholder={field.placeholder}
                    placeholderTextColor="#7E92B9"
                    secureTextEntry={field.secure}
                    multiline={field.multiline}
                    keyboardType={field.keyboardType}
                    style={[styles.input, field.multiline && styles.multiline]}
                  />
                )}
              </View>
            ))}
          </View>
          {pickerField && currentPicker?.fieldType === 'date' ? (
            <DateTimePicker
              value={draft[pickerField] ? new Date(draft[pickerField]) : new Date()}
              mode="date"
              display="default"
              onChange={(_event, date) => {
                if (!date) return;
                const iso = date.toISOString().split('T')[0];
                const next = { ...draft, [pickerField]: iso };
                setDraft(next);
                onChange(next);
                setPickerField(null);
              }}
            />
          ) : null}
          {pickerField && currentPicker?.fieldType === 'time' ? (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(_event, date) => {
                if (!date) return;
                const formatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const next = { ...draft, [pickerField]: formatted };
                setDraft(next);
                onChange(next);
                setPickerField(null);
              }}
            />
          ) : null}
          {pickerField && currentPicker?.options?.length ? (
            <View style={styles.pickerList}>
              {currentPicker.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    const next = { ...draft, [pickerField]: option };
                    setDraft(next);
                    onChange(next);
                    setPickerField(null);
                  }}
                  style={styles.pickerOption}
                >
                  <Text style={styles.pickerOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>
            <PrimaryButton title="Cancel" variant="ghost" onPress={onClose} />
            <PrimaryButton title="Save" onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#0E1830', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  form: { gap: 12 },
  label: { color: '#DCE6FA', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  input: { backgroundColor: '#101F39', borderRadius: 16, borderWidth: 1, borderColor: colors.border, minHeight: 50, paddingHorizontal: 14, color: '#fff' },
  multiline: { minHeight: 90, paddingTop: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10 },
  selectInput: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#101F39', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: '#fff' },
  pickerWrap: { backgroundColor: '#101F39', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  picker: { color: '#fff', height: 50 },
  pickerList: { gap: 8, paddingVertical: 6 },
  pickerOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#132545' },
  pickerOptionText: { color: '#fff', fontWeight: '700' },
});
