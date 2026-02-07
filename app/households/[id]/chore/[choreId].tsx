/**
 * Chore Detail / Edit Screen
 * View chore info, complete/undo, edit fields, and delete
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useChore,
  useCompleteChore,
  useDeleteChore,
  useUndoCompletion,
  useUpdateChore,
} from '@/lib/hooks/use-chores';
import { useHouseholdMembers } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { calculateNextDueDate, isChoreOverdue } from '@/lib/services/chore-service';
import { ChoreUpdateInput, IntervalType } from '@/lib/types/chore';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

const INTERVAL_LABELS: Record<IntervalType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export default function ChoreDetailScreen() {
  const { id: householdId, choreId } = useLocalSearchParams<{
    id: string;
    choreId: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({}, 'cardBackground');
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const { data: chore, isLoading } = useChore(choreId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles } = useUserProfiles(memberUserIds);

  const completeMutation = useCompleteChore(householdId ?? '', user?.uid ?? '');
  const undoMutation = useUndoCompletion(householdId ?? '', user?.uid ?? '');
  const updateMutation = useUpdateChore(choreId ?? '', householdId ?? '');
  const deleteMutation = useDeleteChore(householdId ?? '');

  // ── Edit state ──
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIntervalType, setEditIntervalType] = useState<IntervalType>('weekly');
  const [editIntervalValue, setEditIntervalValue] = useState('1');
  const [editAssignedTo, setEditAssignedTo] = useState<string | undefined>();

  const startEditing = () => {
    if (!chore) return;
    setEditName(chore.name);
    setEditDesc(chore.description ?? '');
    setEditIntervalType(chore.interval.type);
    setEditIntervalValue(String(chore.interval.value));
    setEditAssignedTo(chore.assignedTo);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!chore || !choreId) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Chore name is required');
      return;
    }

    const parsedValue = Math.max(1, parseInt(editIntervalValue, 10) || 1);
    const intervalChanged =
      editIntervalType !== chore.interval.type || parsedValue !== chore.interval.value;

    try {
      const updates: ChoreUpdateInput = {
        name: trimmedName,
        description: editDesc.trim() || undefined,
        assignedTo: editAssignedTo,
        interval: { type: editIntervalType, value: parsedValue },
      };

      // If interval changed, recalculate dueAt forward from now
      if (intervalChanged) {
        const nextDue = calculateNextDueDate(new Date(), {
          type: editIntervalType,
          value: parsedValue,
        });
        updates.dueAt = Timestamp.fromDate(nextDue);
        updates.isOverdue = false;
      }

      await updateMutation.mutateAsync(updates);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleComplete = async () => {
    if (!choreId) return;
    try {
      await completeMutation.mutateAsync(choreId);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleUndo = async () => {
    if (!choreId) return;
    try {
      await undoMutation.mutateAsync(choreId);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    if (!choreId || !chore) return;
    Alert.alert(
      'Delete Chore',
      `Delete "${chore.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(choreId);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={[styles.center, { backgroundColor }]}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </>
    );
  }

  if (!chore) {
    return (
      <>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={[styles.center, { backgroundColor }]}>
          <ThemedText>Chore not found</ThemedText>
        </View>
      </>
    );
  }

  const overdue = isChoreOverdue(chore);
  const completed = !!chore.lastCompletion;
  const assigneeProfile = profiles[memberUserIds.indexOf(chore.assignedTo ?? '')];

  return (
    <>
      <Stack.Screen options={{ title: chore.name, headerBackTitle: 'Chores' }} />
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
          {/* ── Complete / Undo ── */}
          <Button
            title={completed ? 'Undo Completion' : overdue ? 'Complete (Overdue)' : 'Mark Complete'}
            onPress={completed ? handleUndo : handleComplete}
            color={completed ? 'success' : overdue ? 'danger' : 'primary'}
            size="lg"
            loading={completeMutation.isPending || undoMutation.isPending}
            disabled={completeMutation.isPending || undoMutation.isPending}
            style={{ marginBottom: 16 }}
          />

          {completed && chore.lastCompletion && (
            <ThemedView
              style={styles.completionInfo}
              lightColor={Colors.light.cardBackground}
              darkColor={Colors.dark.cardBackground}
            >
              <ThemedText style={styles.completionLabel}>
                Completed {chore.lastCompletion.completedAt.toDate().toLocaleString()}
              </ThemedText>
            </ThemedView>
          )}

          {/* ── View / Edit fields ── */}
          {editing ? (
            <EditForm
              name={editName}
              setName={setEditName}
              description={editDesc}
              setDescription={setEditDesc}
              intervalType={editIntervalType}
              setIntervalType={setEditIntervalType}
              intervalValue={editIntervalValue}
              setIntervalValue={setEditIntervalValue}
              assignedTo={editAssignedTo}
              setAssignedTo={setEditAssignedTo}
              members={members}
              profiles={profiles}
              inputBg={inputBg}
              borderColor={borderColor}
              textColor={textColor}
              tintColor={tintColor}
              buttonTextColor={buttonTextColor}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              saving={updateMutation.isPending}
            />
          ) : (
            <View style={styles.details}>
              <DetailRow label="Name" value={chore.name} />
              <DetailRow label="Description" value={chore.description || '—'} />
              <DetailRow
                label="Repeat"
                value={`${INTERVAL_LABELS[chore.interval.type]}${chore.interval.value > 1 ? ` (every ${chore.interval.value})` : ''}`}
              />
              <DetailRow
                label="Due"
                value={chore.dueAt.toDate().toLocaleDateString()}
                valueColor={overdue ? errorColor : undefined}
              />
              <DetailRow
                label="Assigned to"
                value={assigneeProfile?.displayName ?? (chore.assignedTo ? 'User' : 'Anyone')}
              />

              <View style={styles.actionRow}>
                <Button
                  title="Edit"
                  onPress={startEditing}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Delete"
                  onPress={handleDelete}
                  color="danger"
                  disabled={deleteMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Sub-components ──

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </ThemedText>
    </View>
  );
}

function EditForm(props: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  intervalType: IntervalType;
  setIntervalType: (v: IntervalType) => void;
  intervalValue: string;
  setIntervalValue: (v: string) => void;
  assignedTo: string | undefined;
  setAssignedTo: (v: string | undefined) => void;
  members: { userId: string }[];
  profiles: (null | { displayName: string })[];
  inputBg: string;
  borderColor: string;
  textColor: string;
  tintColor: string;
  buttonTextColor: string;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const {
    name, setName, description, setDescription,
    intervalType, setIntervalType, intervalValue, setIntervalValue,
    assignedTo, setAssignedTo, members, profiles,
    inputBg, borderColor, textColor, tintColor, buttonTextColor,
    onSave, onCancel, saving,
  } = props;

  return (
    <View style={styles.editForm}>
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
        value={name}
        onChangeText={setName}
        placeholder="Chore name"
        placeholderTextColor={borderColor}
        maxLength={100}
      />
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optional)"
        placeholderTextColor={borderColor}
        multiline
      />
      <View style={styles.chips}>
        {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as IntervalType[]).map((t) => {
          const sel = t === intervalType;
          return (
            <Pressable
              key={t}
              style={[styles.chip, { borderColor }, sel && { backgroundColor: tintColor, borderColor: tintColor }]}
              onPress={() => { setIntervalType(t); setIntervalValue('1'); }}
            >
              <Text style={[styles.chipText, { color: textColor }, sel && { color: buttonTextColor }]}>
                {INTERVAL_LABELS[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {(intervalType === 'monthly' || intervalType === 'yearly' || intervalType === 'custom') && (
        <TextInput
          style={[styles.input, styles.valueInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
          value={intervalValue}
          onChangeText={setIntervalValue}
          keyboardType="number-pad"
          maxLength={3}
        />
      )}
      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, { borderColor }, !assignedTo && { backgroundColor: tintColor, borderColor: tintColor }]}
          onPress={() => setAssignedTo(undefined)}
        >
          <Text style={[styles.chipText, { color: textColor }, !assignedTo && { color: buttonTextColor }]}>Anyone</Text>
        </Pressable>
        {members.map((m, i) => {
          const sel = assignedTo === m.userId;
          return (
            <Pressable
              key={m.userId}
              style={[styles.chip, { borderColor }, sel && { backgroundColor: tintColor, borderColor: tintColor }]}
              onPress={() => setAssignedTo(m.userId)}
            >
              <Text style={[styles.chipText, { color: textColor }, sel && { color: buttonTextColor }]}>
                {profiles[i]?.displayName ?? 'User'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actionRow}>
        <Button
          title="Cancel"
          variant="outlined"
          onPress={onCancel}
          disabled={saving}
          style={{ flex: 1 }}
        />
        <Button
          title="Save"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  completionInfo: { padding: 12, borderRadius: 8, marginBottom: 20 },
  completionLabel: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
  details: { marginTop: 4 },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 13, opacity: 0.6, marginBottom: 2 },
  detailValue: { fontSize: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editForm: { gap: 14, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  valueInput: { width: 70, textAlign: 'center' },
});
