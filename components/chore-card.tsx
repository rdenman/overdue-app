/**
 * ChoreCard - Reusable chore display card
 * Shows chore name, due date, assignment, overdue badge, and quick complete toggle
 */

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Typography } from '@/components/ui/typography';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { Chore } from '@/lib/types/chore';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ChoreCardProps {
  chore: Chore;
  /** Display name of assigned user, if any */
  assigneeName?: string;
  /** Household name — shown when listing across households (Today view) */
  householdName?: string;
  onPress?: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  disabled?: boolean;
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return due.toLocaleDateString();
}

export function ChoreCard({
  chore,
  assigneeName,
  householdName,
  onPress,
  onComplete,
  onUndo,
  disabled,
}: ChoreCardProps) {
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');
  const borderColor = useThemeColor({}, 'border');

  const overdue = isChoreOverdue(chore);
  const completed = !!chore.lastCompletion;
  const dueDate = chore.dueAt.toDate();
  const dueDateLabel = formatDueDate(dueDate);

  return (
    <Card onPress={onPress} disabled={disabled} style={styles.card}>
      <View style={styles.row}>
        {/* Completion toggle */}
        <Pressable
          style={[
            styles.checkbox,
            completed && { backgroundColor: successColor, borderColor: successColor },
            !completed && { borderColor: overdue ? errorColor : borderColor },
          ]}
          onPress={completed ? onUndo : onComplete}
          disabled={disabled}
          hitSlop={8}
        >
          {completed && (
            <Typography style={styles.checkmark}>✓</Typography>
          )}
        </Pressable>

        {/* Chore info */}
        <View style={styles.info}>
          <Typography
            variant="bodySemiBold"
            style={[
              styles.name,
              completed && styles.completedName,
            ]}
            numberOfLines={1}
          >
            {chore.name}
          </Typography>

          <View style={styles.meta}>
            <Typography
              variant="caption"
              style={[
                overdue && { color: errorColor },
                completed && { color: successColor },
              ]}
              muted={!overdue && !completed}
            >
              {completed ? 'Done' : dueDateLabel}
            </Typography>

            {assigneeName ? (
              <Typography variant="caption" muted numberOfLines={1} style={styles.metaItem}>
                · {assigneeName}
              </Typography>
            ) : null}

            {householdName ? (
              <Typography variant="caption" muted numberOfLines={1} style={styles.metaItem}>
                · {householdName}
              </Typography>
            ) : null}
          </View>
        </View>

        {/* Overdue badge */}
        {overdue && !completed && (
          <Chip
            label="Overdue"
            selected
            color="danger"
            size="sm"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
  },
  completedName: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaItem: {
    marginLeft: 4,
  },
});
