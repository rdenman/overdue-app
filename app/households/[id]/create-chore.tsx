/**
 * Create Chore Screen
 * Form for creating a new chore within a household
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCreateChore } from '@/lib/hooks/use-chores';
import { useHouseholdMembers } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { calculateNextDueDate } from '@/lib/services/chore-service';
import { IntervalType } from '@/lib/types/chore';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

const INTERVAL_OPTIONS: { label: string; type: IntervalType; defaultValue: number }[] = [
  { label: 'Daily', type: 'daily', defaultValue: 1 },
  { label: 'Weekly', type: 'weekly', defaultValue: 1 },
  { label: 'Monthly', type: 'monthly', defaultValue: 1 },
  { label: 'Yearly', type: 'yearly', defaultValue: 1 },
  { label: 'Custom (days)', type: 'custom', defaultValue: 3 },
];

export default function CreateChoreScreen() {
  const { id: householdId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({}, 'cardBackground');
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const createMutation = useCreateChore(householdId ?? '');
  const { data: members = [] } = useHouseholdMembers(householdId);
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles } = useUserProfiles(memberUserIds);

  // ── Form state ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [intervalType, setIntervalType] = useState<IntervalType>('weekly');
  const [intervalValue, setIntervalValue] = useState('1');
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);

  const parsedValue = Math.max(1, parseInt(intervalValue, 10) || 1);

  const previewDueDate = useMemo(() => {
    return calculateNextDueDate(new Date(), { type: intervalType, value: parsedValue });
  }, [intervalType, parsedValue]);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Chore name is required');
      return;
    }
    if (trimmedName.length > 100) {
      Alert.alert('Error', 'Chore name must be 100 characters or fewer');
      return;
    }
    if (!user || !householdId) return;

    try {
      await createMutation.mutateAsync({
        householdId,
        name: trimmedName,
        description: description.trim() || undefined,
        assignedTo,
        createdBy: user.uid,
        interval: { type: intervalType, value: parsedValue },
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: 'New Chore', headerBackTitle: 'Chores' }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          style={[styles.container, { backgroundColor }]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <ThemedView style={styles.content}>
            {/* Name */}
          <View style={styles.field}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Name *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Vacuum living room"
              placeholderTextColor={borderColor}
              maxLength={100}
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Description
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: inputBg, borderColor, color: textColor },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details..."
              placeholderTextColor={borderColor}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Interval type */}
          <View style={styles.field}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Repeat
            </ThemedText>
            <View style={styles.chips}>
              {INTERVAL_OPTIONS.map((opt) => {
                const selected = opt.type === intervalType;
                return (
                  <Pressable
                    key={opt.type}
                    style={[
                      styles.chip,
                      { borderColor },
                      selected && { backgroundColor: tintColor, borderColor: tintColor },
                    ]}
                    onPress={() => {
                      setIntervalType(opt.type);
                      setIntervalValue(String(opt.defaultValue));
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: textColor },
                        selected && { color: buttonTextColor },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Interval value (for "every N") */}
          {(intervalType === 'monthly' ||
            intervalType === 'yearly' ||
            intervalType === 'custom') && (
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Every
              </ThemedText>
              <View style={styles.valueRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.valueInput,
                    { backgroundColor: inputBg, borderColor, color: textColor },
                  ]}
                  value={intervalValue}
                  onChangeText={setIntervalValue}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <ThemedText style={styles.valueUnit}>
                  {intervalType === 'monthly'
                    ? parsedValue === 1
                      ? 'month'
                      : 'months'
                    : intervalType === 'yearly'
                      ? parsedValue === 1
                        ? 'year'
                        : 'years'
                      : parsedValue === 1
                        ? 'day'
                        : 'days'}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Due date preview */}
          <View style={styles.field}>
            <ThemedText style={styles.preview}>
              First due: {previewDueDate.toLocaleDateString()}
            </ThemedText>
          </View>

          {/* Assignment */}
          <View style={styles.field}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Assign to
            </ThemedText>
            <View style={styles.chips}>
              <Pressable
                style={[
                  styles.chip,
                  { borderColor },
                  !assignedTo && { backgroundColor: tintColor, borderColor: tintColor },
                ]}
                onPress={() => setAssignedTo(undefined)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: textColor },
                    !assignedTo && { color: buttonTextColor },
                  ]}
                >
                  Anyone
                </Text>
              </Pressable>
              {members.map((member, idx) => {
                const profile = profiles[idx];
                const selected = assignedTo === member.userId;
                return (
                  <Pressable
                    key={member.userId}
                    style={[
                      styles.chip,
                      { borderColor },
                      selected && { backgroundColor: tintColor, borderColor: tintColor },
                    ]}
                    onPress={() => setAssignedTo(member.userId)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: textColor },
                        selected && { color: buttonTextColor },
                      ]}
                    >
                      {profile?.displayName ?? 'User'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Submit */}
          <Button
            title="Create Chore"
            onPress={handleCreate}
            size="lg"
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={{ marginTop: 12 }}
          />
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1 },
  content: { padding: 20 },
  field: { marginBottom: 20 },
  label: { marginBottom: 8, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  valueInput: { width: 70, textAlign: 'center' },
  valueUnit: { fontSize: 16, opacity: 0.7 },
  preview: { fontSize: 14, opacity: 0.6, fontStyle: 'italic' },
});
