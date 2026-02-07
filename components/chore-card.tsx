/**
 * ChoreCard - Reusable chore display card
 * Shows chore name, due date, assignment, overdue badge, and quick complete toggle
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
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
    <Pressable onPress={onPress} disabled={disabled}>
      <ThemedView
        style={[styles.card, { borderColor }]}
        lightColor={Colors.light.cardBackground}
        darkColor={Colors.dark.cardBackground}
      >
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
              <ThemedText style={styles.checkmark}>✓</ThemedText>
            )}
          </Pressable>

          {/* Chore info */}
          <View style={styles.info}>
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.name,
                completed && styles.completedName,
              ]}
              numberOfLines={1}
            >
              {chore.name}
            </ThemedText>

            <View style={styles.meta}>
              <ThemedText
                style={[
                  styles.dueText,
                  overdue && { color: errorColor },
                  completed && { color: successColor },
                ]}
              >
                {completed ? 'Done' : dueDateLabel}
              </ThemedText>

              {assigneeName ? (
                <ThemedText style={styles.assignee} numberOfLines={1}>
                  · {assigneeName}
                </ThemedText>
              ) : null}

              {householdName ? (
                <ThemedText style={styles.household} numberOfLines={1}>
                  · {householdName}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {/* Overdue badge */}
          {overdue && !completed && (
            <View style={[styles.badge, { backgroundColor: errorColor }]}>
              <ThemedText style={styles.badgeText} lightColor="#fff" darkColor="#fff">
                Overdue
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
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
  dueText: {
    fontSize: 13,
    opacity: 0.7,
  },
  assignee: {
    fontSize: 13,
    opacity: 0.6,
    marginLeft: 4,
  },
  household: {
    fontSize: 13,
    opacity: 0.6,
    marginLeft: 4,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
