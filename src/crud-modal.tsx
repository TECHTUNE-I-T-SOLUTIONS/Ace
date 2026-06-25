import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '@/theme';
import { PrimaryButton } from '@/components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

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

  useEffect(() => {
    if (visible) {
      setDraft(values);
      setCurrentStep(1);
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              {totalSteps > 1 && (
                <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {stepFields.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
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
                        dropdownIconColor={colors.muted}
                      >
                        <Picker.Item label={field.placeholder ?? 'Select option'} value="" color={colors.muted} />
                        {field.options.map((option) => (
                          <Picker.Item key={option} label={option} value={option} color="#fff" />
                        ))}
                      </Picker>
                    </View>
                  ) : field.fieldType === 'date' ? (
                    <Pressable onPress={() => setPickerField(field.key)} style={styles.selectInput}>
                      <Text style={[styles.selectText, !draft[field.key] && { color: colors.muted }]}>
                        {draft[field.key] || field.placeholder || 'Pick a date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </Pressable>
                  ) : field.fieldType === 'time' ? (
                    <Pressable onPress={() => setPickerField(field.key)} style={styles.selectInput}>
                      <Text style={[styles.selectText, !draft[field.key] && { color: colors.muted }]}>
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
                      placeholderTextColor={colors.muted}
                      secureTextEntry={field.secure}
                      multiline={field.multiline}
                      keyboardType={field.keyboardType}
                      style={[styles.input, field.multiline && styles.multiline]}
                    />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5, 15, 29, 0.85)', justifyContent: 'flex-end' },
  card: { 
    backgroundColor: colors.background, 
    borderTopLeftRadius: radii.xl, 
    borderTopRightRadius: radii.xl, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    gap: 20,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  stepIndicator: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 4 },
  formScroll: { maxHeight: 450 },
  form: { gap: 18, paddingBottom: 10 },
  fieldGroup: { gap: 8 },
  label: { color: '#DCE6FA', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    backgroundColor: 'rgba(16, 31, 57, 0.8)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(148, 175, 230, 0.12)', 
    minHeight: 54, 
    paddingHorizontal: 16, 
    color: '#fff',
    fontSize: 16,
  },
  multiline: { minHeight: 120, paddingTop: 16, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  selectInput: { 
    minHeight: 54, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(148, 175, 230, 0.12)', 
    backgroundColor: 'rgba(16, 31, 57, 0.8)', 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  selectText: { color: '#fff', fontSize: 16 },
  pickerWrap: { 
    backgroundColor: 'rgba(16, 31, 57, 0.8)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(148, 175, 230, 0.12)', 
    overflow: 'hidden' 
  },
  picker: { color: '#fff', height: 54 },
});
