/**
 * Calendar View Screen
 * Monthly calendar showing chores across all user households with day detail
 */

import { ChoreCard } from '@/components/chore-card';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/lib/contexts/theme-context';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCompleteChore,
  useTodayChores,
  useUndoCompletion,
} from '@/lib/hooks/use-chores';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { Chore } from '@/lib/types/chore';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const borderColor = useThemeColor({}, 'border');

  const todayStr = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: households = [] } = useUserHouseholds(user?.uid);
  const householdIds = useMemo(() => households.map((h) => h.id), [households]);
  const householdMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of households) map[h.id] = h.name;
    return map;
  }, [households]);

  const { data: allChores = [], isLoading } = useTodayChores(user?.uid, householdIds);

  // Build markedDates for the calendar (multi-dot)
  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }> = {};

    for (const chore of allChores) {
      // Skip chores with no due date
      if (!chore.dueAt) continue;

      const dateStr = toDateString(chore.dueAt.toDate());
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };

      const overdue = isChoreOverdue(chore);
      const dotColor = overdue ? errorColor : tintColor;
      // Avoid duplicate dot colors on same day
      if (!marks[dateStr].dots.some((d) => d.color === dotColor)) {
        marks[dateStr].dots.push({ key: `${dateStr}-${dotColor}`, color: dotColor });
      }
    }

    // Mark selected date
    if (!marks[selectedDate]) marks[selectedDate] = { dots: [] };
    marks[selectedDate].selected = true;
    marks[selectedDate].selectedColor = tintColor;

    return marks;
  }, [allChores, selectedDate, errorColor, tintColor]);

  // Filter chores for the selected date
  const selectedChores = useMemo(() => {
    return allChores
      .filter((c) => c.dueAt && toDateString(c.dueAt.toDate()) === selectedDate)
      .sort((a, b) => {
        const aOverdue = isChoreOverdue(a);
        const bOverdue = isChoreOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return a.dueAt!.toMillis() - b.dueAt!.toMillis();
      });
  }, [allChores, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: backgroundColor,
      dayTextColor: textColor,
      monthTextColor: textColor,
      textSectionTitleColor: textColor,
      todayTextColor: tintColor,
      arrowColor: tintColor,
      selectedDayTextColor: theme === 'dark' ? '#000' : '#fff',
      textDisabledColor: theme === 'dark' ? '#555' : '#ccc',
    }),
    [backgroundColor, textColor, tintColor, theme]
  );

  const renderChore = useCallback(
    ({ item }: { item: Chore }) => (
      <CalendarChoreCard
        chore={item}
        householdName={householdMap[item.householdId]}
        userId={user?.uid ?? ''}
        onPress={() => router.push(`/households/${item.householdId}/chore/${item.id}`)}
      />
    ),
    [householdMap, user?.uid, router]
  );

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  return (
    <>
      <Stack.Screen options={{ title: 'Calendar', headerBackTitle: 'Today' }} />
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Calendar
          current={selectedDate}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="multi-dot"
          enableSwipeMonths
          theme={calendarTheme}
          style={[styles.calendar, { borderBottomColor: borderColor }]}
        />

        <View style={styles.dayDetail}>
          <Typography variant="bodySemiBold" style={styles.dayLabel}>
            {selectedDateLabel}
          </Typography>

          {isLoading ? (
            <LoadingState message="Loading chores..." />
          ) : (
            <FlatList
              data={selectedChores}
              keyExtractor={(item) => item.id}
              renderItem={renderChore}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <EmptyState title="No chores" message="Nothing scheduled for this day." />
              }
            />
          )}
        </View>
      </ThemedView>
    </>
  );
}

function CalendarChoreCard({
  chore,
  householdName,
  userId,
  onPress,
}: {
  chore: Chore;
  householdName?: string;
  userId: string;
  onPress: () => void;
}) {
  const completeMutation = useCompleteChore(chore.householdId, userId);
  const undoMutation = useUndoCompletion(chore.householdId, userId);

  return (
    <ChoreCard
      chore={chore}
      householdName={householdName}
      onPress={onPress}
      onComplete={() => completeMutation.mutate(chore.id)}
      onUndo={() => undoMutation.mutate(chore.id)}
      disabled={completeMutation.isPending || undoMutation.isPending}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: { borderBottomWidth: 1 },
  dayDetail: { flex: 1 },
  dayLabel: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  list: { padding: 16, paddingBottom: 40 },
});
