/**
 * Create Chore Screen
 * Form for creating a new chore within a household
 */

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
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
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
  const headerHeight = useHeaderHeight();

  const backgroundColor = useThemeColor({}, 'background');

  const createMutation = useCreateChore(householdId ?? '', user?.uid);
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
              <Input
                label="Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Vacuum living room"
                maxLength={100}
                autoFocus
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Optional details..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Interval type */}
            <View style={styles.field}>
              <Typography variant="label" style={styles.fieldLabel}>
                Repeat
              </Typography>
              <View style={styles.chips}>
                {INTERVAL_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.type}
                    label={opt.label}
                    selected={opt.type === intervalType}
                    onPress={() => {
                      setIntervalType(opt.type);
                      setIntervalValue(String(opt.defaultValue));
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Interval value (for "every N") */}
            {(intervalType === 'monthly' ||
              intervalType === 'yearly' ||
              intervalType === 'custom') && (
              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  Every
                </Typography>
                <View style={styles.valueRow}>
                  <Input
                    value={intervalValue}
                    onChangeText={setIntervalValue}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.valueInput}
                  />
                  <Typography muted style={styles.valueUnit}>
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
                  </Typography>
                </View>
              </View>
            )}

            {/* Due date preview */}
            <View style={styles.field}>
              <Typography variant="caption" muted style={styles.preview}>
                First due: {previewDueDate.toLocaleDateString()}
              </Typography>
            </View>

            {/* Assignment */}
            <View style={styles.field}>
              <Typography variant="label" style={styles.fieldLabel}>
                Assign to
              </Typography>
              <View style={styles.chips}>
                <Chip
                  label="Anyone"
                  selected={!assignedTo}
                  onPress={() => setAssignedTo(undefined)}
                />
                {members.map((member, idx) => (
                  <Chip
                    key={member.userId}
                    label={profiles[idx]?.displayName ?? 'User'}
                    selected={assignedTo === member.userId}
                    onPress={() => setAssignedTo(member.userId)}
                  />
                ))}
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
  fieldLabel: { marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  valueInput: { width: 70, textAlign: 'center' },
  valueUnit: { fontSize: 16 },
  preview: { fontStyle: 'italic' },
});
