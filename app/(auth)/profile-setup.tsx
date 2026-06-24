import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppInput, GradientShell, PrimaryButton } from '@/components';
import { apiGet } from '@/api';
import { router } from 'expo-router';
import { showError, showSuccess } from '@/toast';
import { getActiveSchool } from '@/schools';
import { supabase } from '@/lib/supabase';

export default function ProfileSetup() {
  const school = getActiveSchool();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState(school.name);
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  const facultyOptions = school.faculties;
  const selectedFaculty = useMemo(() => facultyOptions.find((item) => item.name === faculty) ?? null, [faculty, facultyOptions]);
  const departmentOptions = selectedFaculty?.departments ?? [];

  useEffect(() => {
    apiGet<any>('/users/me')
      .then((profile) => {
        setFullName(profile?.full_name ?? '');
        setInstitution(profile?.institution ?? school.name);
        setFaculty(profile?.faculty ?? '');
        setDepartment(profile?.department ?? '');
        setLevel(profile?.level ?? '');
        setStudentId(profile?.student_id ?? '');
      })
      .catch((error) => showError(error.message));
  }, [school.name]);

  const saveProfile = async () => {
    try {
      setLoading(true);
      if (!supabase) throw new Error('Supabase client is not configured');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error('You must be signed in to complete your profile');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          institution,
          faculty,
          department,
          level,
          student_id: studentId.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      showSuccess('Profile completed');
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      showError(error.message ?? 'Unable to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Add a few details so ACE can personalize your semester.</Text>
        <View style={styles.form}>
          <AppInput label="Full Name" placeholder="John Doe" value={fullName} onChangeText={setFullName} />
          <Selector label="Institution" value={institution} onPress={() => setInstitution(school.name)} />
          <Selector label="Faculty" value={faculty || 'Select faculty'} onPress={() => setShowFacultyPicker(true)} />
          <Selector
            label="Department"
            value={department || 'Select department'}
            onPress={() => (selectedFaculty ? setShowDepartmentPicker(true) : showError('Choose a faculty first'))}
          />
          <AppInput label="Level" placeholder="300" value={level} onChangeText={setLevel} />
          <AppInput label="Student ID" placeholder="CS-2023-001234" value={studentId} onChangeText={setStudentId} />
          <PrimaryButton title={loading ? 'Saving...' : 'Save Profile'} onPress={saveProfile} />
          {loading ? <ActivityIndicator color="#fff" /> : null}
        </View>
      </ScrollView>

      <PickerModal
        visible={showFacultyPicker}
        title="Select Faculty"
        options={facultyOptions.map((item) => item.name)}
        onClose={() => setShowFacultyPicker(false)}
        onSelect={(value) => {
          setFaculty(value);
          setDepartment('');
          setShowFacultyPicker(false);
        }}
      />

      <PickerModal
        visible={showDepartmentPicker}
        title="Select Department"
        options={departmentOptions.map((item) => item.name)}
        onClose={() => setShowDepartmentPicker(false)}
        onSelect={(value) => {
          setDepartment(value);
          setShowDepartmentPicker(false);
        }}
      />
    </GradientShell>
  );
}

function Selector({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable onPress={onPress} style={styles.selector}>
        <Text style={styles.selectorText}>{value}</Text>
        <Text style={styles.selectorCaret}>⌄</Text>
      </Pressable>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable key={option} onPress={() => onSelect(option)} style={styles.optionRow}>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 16, gap: 12 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#AFC0DF', marginTop: 6, marginBottom: 14 },
  form: { gap: 14 },
  selectorLabel: { color: '#DCE6FA', fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  selector: {
    backgroundColor: '#101F39',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,175,230,0.18)',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectorText: { color: '#fff', fontSize: 15 },
  selectorCaret: { color: '#9CB0D0', fontSize: 18, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#0E1830', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(148,175,230,0.18)', gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  closeText: { color: '#5D89FF', fontWeight: '800' },
  optionRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(148,175,230,0.12)' },
  optionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
