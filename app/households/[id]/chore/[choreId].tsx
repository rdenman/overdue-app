/**
 * Chore Detail / Edit Screen
 * View chore info, complete/undo, edit fields, and delete
 */

import { ChoreEditForm } from '@/components/chore-edit-form';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
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
import {
  calculateNextDueDate,
  getUpcomingDueDates,
  isChoreOverdue,
} from '@/lib/services/chore-service';
import { ChoreUpdateInput, IntervalType } from '@/lib/types/chore';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
  const headerHeight = useHeaderHeight();

  const backgroundColor = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'error');

  const { data: chore, isLoading } = useChore(choreId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles } = useUserProfiles(memberUserIds);

  const completeMutation = useCompleteChore(householdId ?? '', user?.uid ?? '');
  const undoMutation = useUndoCompletion(householdId ?? '', user?.uid ?? '');
  const updateMutation = useUpdateChore(choreId ?? '', householdId ?? '', user?.uid);
  const deleteMutation = useDeleteChore(householdId ?? '', user?.uid);

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
    try { await completeMutation.mutateAsync(choreId); }
    catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleUndo = async () => {
    if (!choreId) return;
    try { await undoMutation.mutateAsync(choreId); }
    catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleDelete = () => {
    if (!choreId || !chore) return;
    Alert.alert('Delete Chore', `Delete "${chore.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteMutation.mutateAsync(choreId); router.back(); }
          catch (err: any) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={[styles.center, { backgroundColor }]}><LoadingState /></View>
      </>
    );
  }

  if (!chore) {
    return (
      <>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={[styles.center, { backgroundColor }]}>
          <Typography>Chore not found</Typography>
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
              <Card variant="filled" style={styles.completionInfo}>
                <Typography variant="caption" muted style={styles.completionLabel}>
                  Completed {chore.lastCompletion.completedAt.toDate().toLocaleString()}
                </Typography>
              </Card>
            )}

            {editing ? (
              <ChoreEditForm
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
                  <Button title="Edit" onPress={startEditing} style={{ flex: 1 }} />
                  <Button
                    title="Delete"
                    onPress={handleDelete}
                    color="danger"
                    disabled={deleteMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
                <UpcomingSchedule chore={chore} />
              </View>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Sub-components ──

function UpcomingSchedule({ chore }: { chore: { dueAt: { toDate: () => Date }; interval: { type: IntervalType; value: number } } }) {
  const upcoming = useMemo(
    () => getUpcomingDueDates(chore.dueAt.toDate(), chore.interval, 5),
    [chore.dueAt, chore.interval]
  );
  return (
    <View style={styles.upcomingSection}>
      <Typography variant="sectionTitle" style={styles.upcomingTitle}>
        Upcoming Schedule
      </Typography>
      {upcoming.map((date, i) => (
        <View key={i} style={styles.upcomingRow}>
          <Typography muted style={styles.upcomingIdx}>{i + 1}.</Typography>
          <Typography>
            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </View>
      ))}
    </View>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Typography variant="caption" muted>{label}</Typography>
      <Typography style={valueColor ? { color: valueColor } : undefined}>{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  completionInfo: { marginBottom: 20 },
  completionLabel: { textAlign: 'center' },
  details: { marginTop: 4 },
  detailRow: { marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  upcomingSection: { marginTop: 28 },
  upcomingTitle: { marginBottom: 10 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  upcomingIdx: { width: 24 },
});
