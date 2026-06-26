import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from './theme';
import { PrimaryButton } from './components';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface ModalField {
  key: string;
  label: string;
  placeholder?: string;
  secure?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  options?: string[];
  fieldType?: 'text' | 'date' | 'time' | 'select';
  step?: number;
}

export function CrudModal({
  visible,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSubmit,
  totalSteps = 1,
}: {
  visible: boolean;
  title: string;
  fields: ModalField[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: () => void;
  totalSteps?: number;
}) {
  const [draft, setDraft] = useState(values);
  const [currentStep, setCurrentStep] = useState(1);
  const [pickerField, setPickerField] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = true; // Forcing dark mode as per app design, but keeping logic for future

  const visibleRef = useRef(visible);
  useEffect(() => {
    const justOpened = visible && !visibleRef.current;
    visibleRef.current = visible;
    if (visible) {
      setDraft(values);
      if (justOpened) {
        setCurrentStep(1);
      }
    }
  }, [values, visible]);

  const stepFields = useMemo(() => {
    if (totalSteps <= 1) return fields;
    return fields.filter(f => (f.step ?? 1) === currentStep);
  }, [fields, currentStep, totalSteps]);

  const currentPicker = useMemo(() => 
    fields.find((field) => field.key === pickerField) ?? null,
  [fields, pickerField]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const themeStyles = {
    modalBg: isDark ? colors.background : '#fff',
    text: isDark ? '#fff' : '#111',
    mutedText: isDark ? colors.muted : '#666',
    inputBg: isDark ? 'rgba(16, 31, 57, 0.8)' : '#f5f7fa',
    border: isDark ? 'rgba(148, 175, 230, 0.12)' : '#e1e8ed',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: themeStyles.modalBg }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: themeStyles.text }]}>{title}</Text>
              {totalSteps > 1 && (
                <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={themeStyles.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {stepFields.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: themeStyles.mutedText }]}>{field.label}</Text>
                  {field.options?.length || field.fieldType === 'select' ? (
                    <Pressable onPress={() => setPickerField(field.key)} style={[styles.selectInput, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border }]}>
                      <Text style={[styles.selectText, { color: draft[field.key] ? themeStyles.text : themeStyles.mutedText }]}>
                        {draft[field.key] || field.placeholder || 'Select option'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.primary} />
                    </Pressable>
                  ) : field.fieldType === 'date' ? (
                    <Pressable onPress={() => setPickerField(field.key)} style={[styles.selectInput, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border }]}>
                      <Text style={[styles.selectText, { color: draft[field.key] ? themeStyles.text : themeStyles.mutedText }]}>
                        {draft[field.key] || field.placeholder || 'Pick a date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </Pressable>
                  ) : field.fieldType === 'time' ? (
                    <Pressable onPress={() => setPickerField(field.key)} style={[styles.selectInput, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border }]}>
                      <Text style={[styles.selectText, { color: draft[field.key] ? themeStyles.text : themeStyles.mutedText }]}>
                        {draft[field.key] || field.placeholder || 'Pick a time'}
                      </Text>
                      <Ionicons name="time-outline" size={20} color={colors.primary} />
                    </Pressable>
                  ) : (
                    <TextInput
                      value={draft[field.key] ?? ''}
                      onChangeText={(text) => {
                        const next = { ...draft, [field.key]: text };
                        setDraft(next);
                        onChange(next);
                      }}
                      placeholder={field.placeholder}
                      placeholderTextColor={themeStyles.mutedText}
                      secureTextEntry={field.secure}
                      multiline={field.multiline}
                      keyboardType={field.keyboardType}
                      style={[styles.input, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border, color: themeStyles.text }, field.multiline && styles.multiline]}
                    />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            {currentStep > 1 ? (
              <PrimaryButton title="Back" variant="ghost" onPress={handleBack} />
            ) : (
              <PrimaryButton title="Cancel" variant="ghost" onPress={onClose} />
            )}
            <View style={{ flex: 1 }}>
              <PrimaryButton 
                title={currentStep < totalSteps ? 'Next Step' : 'Save'} 
                onPress={handleNext} 
              />
            </View>
          </View>
        </View>

        {pickerField && currentPicker?.options?.length && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setPickerField(null)}>
              <View style={[styles.pickerModal, { backgroundColor: isDark ? colors.surface : '#fff', borderColor: themeStyles.border }]}>
                <Text style={[styles.pickerTitle, { color: themeStyles.text }]}>Select {currentPicker.label}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {currentPicker.options?.map((opt) => (
                    <Pressable 
                      key={opt} 
                      onPress={() => {
                        const next = { ...draft, [pickerField]: opt };
                        setDraft(next);
                        onChange(next);
                        setPickerField(null);
                      }}
                      style={[styles.pickerItem, draft[pickerField] === opt && styles.pickerItemActive]}
                    >
                      <Text style={[styles.pickerItemText, { color: isDark ? '#B2C3E1' : '#444' }, draft[pickerField] === opt && styles.pickerItemTextActive]}>{opt}</Text>
                      {draft[pickerField] === opt && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        )}

        {pickerField && currentPicker?.fieldType === 'date' ? (
          <DateTimePicker
            value={draft[pickerField] ? new Date(draft[pickerField]) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, date) => {
              setPickerField(null);
              if (date) {
                const iso = date.toISOString().split('T')[0];
                const next = { ...draft, [pickerField]: iso };
                setDraft(next);
                onChange(next);
              }
            }}
          />
        ) : null}

        {pickerField && currentPicker?.fieldType === 'time' ? (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, date) => {
              setPickerField(null);
              if (date) {
                const formatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const next = { ...draft, [pickerField]: formatted };
                setDraft(next);
                onChange(next);
              }
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5, 15, 29, 0.85)', justifyContent: 'flex-end' },
  card: { 
    borderTopLeftRadius: radii.xl, 
    borderTopRightRadius: radii.xl, 
    padding: 24, 
    borderWidth: 1, 
    gap: 20,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  stepIndicator: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 4 },
  formScroll: { maxHeight: 450 },
  form: { gap: 18, paddingBottom: 10 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    borderRadius: 16, 
    borderWidth: 1, 
    minHeight: 54, 
    paddingHorizontal: 16, 
    fontSize: 16,
  },
  multiline: { minHeight: 120, paddingTop: 16, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  selectInput: { 
    minHeight: 54, 
    borderRadius: 16, 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  selectText: { fontSize: 16 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  pickerModal: { borderRadius: 24, padding: 20, maxHeight: '70%', borderWidth: 1 },
  pickerTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pickerItemActive: { backgroundColor: 'rgba(61, 124, 255, 0.1)' },
  pickerItemText: { fontSize: 16, fontWeight: '600' },
  pickerItemTextActive: { color: colors.primary, fontWeight: '800' },
});
