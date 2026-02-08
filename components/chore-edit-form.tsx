/**
 * ChoreEditForm - Inline edit form for chore detail screen
 * Extracted to keep chore detail screen under 300 LOC
 */

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { IntervalType } from '@/lib/types/chore';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const INTERVAL_LABELS: Record<IntervalType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export interface ChoreEditFormProps {
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
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function ChoreEditForm(props: ChoreEditFormProps) {
  const {
    name, setName, description, setDescription,
    intervalType, setIntervalType, intervalValue, setIntervalValue,
    assignedTo, setAssignedTo, members, profiles,
    onSave, onCancel, saving,
  } = props;

  return (
    <View style={styles.editForm}>
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Chore name"
        maxLength={100}
      />
      <Input
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optional)"
        multiline
      />
      <View style={styles.chips}>
        {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as IntervalType[]).map((t) => (
          <Chip
            key={t}
            label={INTERVAL_LABELS[t]}
            selected={t === intervalType}
            onPress={() => { setIntervalType(t); setIntervalValue('1'); }}
          />
        ))}
      </View>
      {(intervalType === 'monthly' || intervalType === 'yearly' || intervalType === 'custom') && (
        <Input
          value={intervalValue}
          onChangeText={setIntervalValue}
          keyboardType="number-pad"
          maxLength={3}
          style={styles.valueInput}
        />
      )}
      <View style={styles.chips}>
        <Chip
          label="Anyone"
          selected={!assignedTo}
          onPress={() => setAssignedTo(undefined)}
        />
        {members.map((m, i) => (
          <Chip
            key={m.userId}
            label={profiles[i]?.displayName ?? 'User'}
            selected={assignedTo === m.userId}
            onPress={() => setAssignedTo(m.userId)}
          />
        ))}
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
  editForm: { gap: 14, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  valueInput: { width: 70, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
