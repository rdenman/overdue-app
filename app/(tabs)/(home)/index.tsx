/**
 * Today's Chores Screen
 * Shows chores due today and overdue across all user households
 */

import { ChoreCard } from '@/components/chore-card';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/ui/loading-state';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCompleteChore, useTodayChores, useUndoCompletion } from '@/lib/hooks/use-chores';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useNotificationSettings } from '@/lib/hooks/use-notification-settings';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { scheduleAllNotifications } from '@/lib/services/notification-service';
import { Chore } from '@/lib/types/chore';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';

export default function TodayScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'background');

  const { data: households = [], isPending: householdsPending } = useUserHouseholds(user?.uid);
  const householdIds = useMemo(() => households.map((h) => h.id), [households]);
  const householdMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of households) map[h.id] = h.name;
    return map;
  }, [households]);

  const tintColor = useThemeColor({}, 'tint');
  const { settings } = useNotificationSettings();

  const {
    data: allChores = [],
    isPending: choresPending,
    refetch,
  } = useTodayChores(user?.uid, householdIds);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const isLoading = householdsPending || (householdIds.length > 0 && choresPending);

  // Configure header with calendar button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/calendar')}
          hitSlop={8}
        >
          <IconSymbol name="calendar" size={22} color={tintColor} />
        </Pressable>
      ),
    });
  }, [navigation, router, tintColor]);

  // Sync notifications whenever chore data changes
  useEffect(() => {
    if (allChores.length > 0 && settings.enabled) {
      scheduleAllNotifications(allChores, settings);
    }
  }, [allChores, settings]);

  // Filter to chores that are due today or overdue (not future, not completed)
  const todayChores = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return allChores
      .filter((c) => {
        // Skip chores with no due date (one-off with no deadline)
        if (!c.dueAt) return false;
        const dueDate = c.dueAt.toDate();
        // Show if: due today or before (overdue), regardless of completion
        return dueDate <= endOfToday;
      })
      .sort((a, b) => {
        // Completed items go to bottom
        const aCompleted = !!a.lastCompletion;
        const bCompleted = !!b.lastCompletion;
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        // Overdue first among non-completed
        const aOverdue = isChoreOverdue(a);
        const bOverdue = isChoreOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        // Both guaranteed to have dueAt since we filtered nulls above
        return a.dueAt!.toMillis() - b.dueAt!.toMillis();
      });
  }, [allChores]);

  const renderChore = useCallback(
    ({ item }: { item: Chore }) => (
      <TodayChoreCard
        chore={item}
        householdName={householdMap[item.householdId]}
        userId={user?.uid ?? ''}
        onPress={() =>
          router.push(`/households/${item.householdId}/chore/${item.id}`)
        }
      />
    ),
    [householdMap, user?.uid, router]
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {isLoading ? (
        <LoadingState message="Loading chores..." style={styles.center} />
      ) : (
        <FlatList
          data={todayChores}
          keyExtractor={(item) => item.id}
          renderItem={renderChore}
          contentContainerStyle={styles.list}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <EmptyState
              title="All caught up!"
              message="No chores due today. Enjoy your free time!"
            />
          }
        />
      )}
    </ThemedView>
  );
}

/**
 * Wrapper around ChoreCard that provides per-household complete/undo mutations
 */
function TodayChoreCard({
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
  center: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
});
