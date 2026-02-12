/**
 * ChoreEditForm - Inline edit form for chore detail screen
 * Extracted to keep chore detail screen under 300 LOC
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { IntervalType } from '@/lib/types/chore';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

const INTERVAL_LABELS: Record<IntervalType, string> = {
  once: 'One-off',
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
  roomId: string | undefined;
  setRoomId: (v: string | undefined) => void;
  dueDate: Date | null;
  setDueDate: (v: Date | null) => void;
  members: { userId: string }[];
  profiles: (null | { displayName: string })[];
  rooms: { id: string; name: string }[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function ChoreEditForm(props: ChoreEditFormProps) {
  const {
    name, setName, description, setDescription,
    intervalType, setIntervalType, intervalValue, setIntervalValue,
    assignedTo, setAssignedTo, roomId, setRoomId, dueDate, setDueDate,
    members, profiles, rooms,
    onSave, onCancel, saving,
  } = props;

  const tintColor = useThemeColor({}, 'tint');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isOneOff = intervalType === 'once';

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

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
        {(['once', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as IntervalType[]).map((t) => (
          <Chip
            key={t}
            label={INTERVAL_LABELS[t]}
            selected={t === intervalType}
            onPress={() => {
              setIntervalType(t);
              setIntervalValue('1');
              if (t === 'once') {
                // Keep existing dueDate when switching to one-off
              }
            }}
          />
        ))}
      </View>
      {!isOneOff && (intervalType === 'monthly' || intervalType === 'yearly' || intervalType === 'custom') && (
        <Input
          value={intervalValue}
          onChangeText={setIntervalValue}
          keyboardType="number-pad"
          maxLength={3}
          style={styles.valueInput}
        />
      )}

      {/* Due date */}
      <View>
        {isOneOff ? (
          <>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Typography style={[styles.dateDisplay, { color: dueDate ? tintColor : undefined }]}>
                {dueDate
                  ? `Due: ${dueDate.toLocaleDateString()}`
                  : 'No deadline — tap to set a date'}
              </Typography>
            </Pressable>
            {dueDate && (
              <Pressable onPress={() => { setDueDate(null); setShowDatePicker(false); }}>
                <Typography variant="caption" style={{ color: tintColor, marginTop: 4 }}>
                  Clear date
                </Typography>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable onPress={() => setShowDatePicker(!showDatePicker)}>
            <Typography variant="caption" muted style={styles.dateDisplay}>
              {dueDate
                ? `Due: ${dueDate.toLocaleDateString()}`
                : 'No due date set'}
              {'  '}
              <Typography variant="caption" style={{ color: tintColor }}>
                Change
              </Typography>
            </Typography>
          </Pressable>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={handleDateChange}
            style={styles.datePicker}
          />
        )}
      </View>

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
      <View style={styles.chips}>
        <Chip
          label="None"
          selected={!roomId}
          onPress={() => setRoomId(undefined)}
        />
        {rooms.map((room) => (
          <Chip
            key={room.id}
            label={room.name}
            selected={roomId === room.id}
            onPress={() => setRoomId(room.id)}
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
  dateDisplay: { fontSize: 15, paddingVertical: 4 },
  datePicker: { marginTop: 8 },
});
