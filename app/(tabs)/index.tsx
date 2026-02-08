/**
 * Today's Chores Screen
 * Shows chores due today and overdue across all user households
 */

import { ChoreCard } from '@/components/chore-card';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCompleteChore, useTodayChores, useUndoCompletion } from '@/lib/hooks/use-chores';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { signOut } from '@/lib/services/auth-service';
import { Chore } from '@/lib/types/chore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  const { data: households = [] } = useUserHouseholds(user?.uid);
  const householdIds = useMemo(() => households.map((h) => h.id), [households]);
  const householdMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of households) map[h.id] = h.name;
    return map;
  }, [households]);

  const {
    data: allChores = [],
    isLoading,
    refetch,
  } = useTodayChores(user?.uid, householdIds);

  // Filter to chores that are due today or overdue (not future, not completed)
  const todayChores = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return allChores
      .filter((c) => {
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
        return a.dueAt.toMillis() - b.dueAt.toMillis();
      });
  }, [allChores]);

  // We need a per-household complete/undo — but since mutations require householdId,
  // we keep a simple approach: call the service directly and refresh
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={user?.emailVerified ? ['top'] : []}
    >
      {user?.emailVerified && <StatusBar style="auto" />}
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View>
            <Typography variant="title">Today&apos;s Chores</Typography>
            <Typography muted style={styles.greeting}>
              Hello, {user?.displayName || 'there'}!
            </Typography>
          </View>
          <Button
            title="Sign Out"
            variant="outlined"
            size="sm"
            onPress={handleSignOut}
          />
        </View>

        {isLoading ? (
          <LoadingState message="Loading chores..." style={styles.center} />
        ) : (
          <FlatList
            data={todayChores}
            keyExtractor={(item) => item.id}
            renderItem={renderChore}
            contentContainerStyle={styles.list}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={
              <EmptyState
                title="All caught up!"
                message="No chores due today. Enjoy your free time!"
              />
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
  },
  greeting: { marginTop: 4 },
  center: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
});
