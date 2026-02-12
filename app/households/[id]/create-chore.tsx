/**
 * Create Chore Screen
 * Form for creating a new chore within a household
 */

import DateTimePicker from '@react-native-community/datetimepicker';
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
import { Timestamp } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const INTERVAL_OPTIONS: { label: string; type: IntervalType; defaultValue: number }[] = [
  { label: 'One-off', type: 'once', defaultValue: 1 },
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
  const tintColor = useThemeColor({}, 'tint');

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

  // Due date override state
  const [customDueDate, setCustomDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isOneOff = intervalType === 'once';
  const parsedValue = Math.max(1, parseInt(intervalValue, 10) || 1);

  const previewDueDate = useMemo(() => {
    if (isOneOff) return null;
    return calculateNextDueDate(new Date(), { type: intervalType, value: parsedValue });
  }, [intervalType, parsedValue, isOneOff]);

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
      // Determine dueAt to send:
      // - One-off with custom date → that date
      // - One-off without date → null (no deadline)
      // - Recurring with custom date → that date (override)
      // - Recurring without custom date → undefined (let service auto-calculate)
      let dueAt: Timestamp | null | undefined;
      if (customDueDate) {
        dueAt = Timestamp.fromDate(customDueDate);
      } else if (isOneOff) {
        dueAt = null;
      } else {
        dueAt = undefined; // let createChore auto-calculate
      }

      await createMutation.mutateAsync({
        householdId,
        name: trimmedName,
        description: description.trim() || undefined,
        assignedTo,
        createdBy: user.uid,
        interval: { type: intervalType, value: isOneOff ? 1 : parsedValue },
        dueAt,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setCustomDueDate(selectedDate);
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
                      setCustomDueDate(null);
                      setShowDatePicker(false);
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Interval value (for "every N") — hidden for one-off */}
            {!isOneOff &&
              (intervalType === 'monthly' ||
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

            {/* Due date section */}
            <View style={styles.field}>
              {isOneOff ? (
                <>
                  <Typography variant="label" style={styles.fieldLabel}>
                    Due date (optional)
                  </Typography>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <Typography style={[styles.dateDisplay, { color: customDueDate ? tintColor : undefined }]}>
                      {customDueDate
                        ? customDueDate.toLocaleDateString()
                        : 'No deadline — tap to set a date'}
                    </Typography>
                  </Pressable>
                  {customDueDate && (
                    <Pressable onPress={() => { setCustomDueDate(null); setShowDatePicker(false); }}>
                      <Typography variant="caption" style={{ color: tintColor, marginTop: 6 }}>
                        Clear date
                      </Typography>
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Pressable onPress={() => setShowDatePicker(!showDatePicker)}>
                    <Typography variant="caption" muted style={styles.preview}>
                      {customDueDate
                        ? `Due: ${customDueDate.toLocaleDateString()}`
                        : `First due: ${previewDueDate?.toLocaleDateString() ?? ''}`}
                      {'  '}
                      <Typography variant="caption" style={{ color: tintColor }}>
                        {customDueDate ? 'Change' : 'Override'}
                      </Typography>
                    </Typography>
                  </Pressable>
                  {customDueDate && (
                    <Pressable onPress={() => { setCustomDueDate(null); setShowDatePicker(false); }}>
                      <Typography variant="caption" style={{ color: tintColor, marginTop: 4 }}>
                        Reset to auto
                      </Typography>
                    </Pressable>
                  )}
                </>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={customDueDate ?? previewDueDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  style={styles.datePicker}
                />
              )}
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
  dateDisplay: { fontSize: 16, paddingVertical: 4 },
  datePicker: { marginTop: 8 },
});
