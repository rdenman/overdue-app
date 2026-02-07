/**
 * Household Chores List Screen
 * Shows all chores in a household sorted by due date (overdue first)
 */

import { ChoreCard } from '@/components/chore-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCompleteChore,
  useHouseholdChores,
  useUndoCompletion,
} from '@/lib/hooks/use-chores';
import { useHousehold, useHouseholdMembers } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { Chore } from '@/lib/types/chore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

export default function HouseholdChoresScreen() {
  const { id: householdId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const { data: household } = useHousehold(householdId);
  const {
    data: chores = [],
    isLoading,
    refetch,
  } = useHouseholdChores(householdId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles } = useUserProfiles(memberUserIds);

  const completeMutation = useCompleteChore(householdId ?? '', user?.uid ?? '');
  const undoMutation = useUndoCompletion(householdId ?? '', user?.uid ?? '');

  // Sort: overdue first, then by dueAt ascending
  const sortedChores = useMemo(() => {
    return [...chores].sort((a, b) => {
      const aOverdue = isChoreOverdue(a);
      const bOverdue = isChoreOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return a.dueAt.toMillis() - b.dueAt.toMillis();
    });
  }, [chores]);

  const getAssigneeName = useCallback(
    (assignedTo?: string) => {
      if (!assignedTo) return undefined;
      const idx = memberUserIds.indexOf(assignedTo);
      return idx >= 0 ? profiles[idx]?.displayName ?? 'User' : undefined;
    },
    [memberUserIds, profiles]
  );

  const renderChore = useCallback(
    ({ item }: { item: Chore }) => (
      <ChoreCard
        chore={item}
        assigneeName={getAssigneeName(item.assignedTo)}
        onPress={() =>
          router.push(`/households/${householdId}/chore/${item.id}`)
        }
        onComplete={() => completeMutation.mutate(item.id)}
        onUndo={() => undoMutation.mutate(item.id)}
      />
    ),
    [getAssigneeName, householdId, router, completeMutation, undoMutation]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: household?.name ?? 'Chores',
          headerBackTitle: 'Households',
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/households/${householdId}/settings`)}
              hitSlop={8}
            >
              <ThemedText style={{ fontSize: 22 }}>⚙</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>
              Loading chores...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={sortedChores}
            keyExtractor={(item) => item.id}
            renderItem={renderChore}
            contentContainerStyle={styles.list}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No chores yet
                </ThemedText>
                <ThemedText style={styles.emptyMessage}>
                  Tap the button below to create your first chore.
                </ThemedText>
              </View>
            }
          />
        )}

        {/* Floating create button */}
        <Pressable
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={() =>
            router.push(`/households/${householdId}/create-chore`)
          }
        >
          <Text style={[styles.fabText, { color: buttonTextColor }]}>
            + New Chore
          </Text>
        </Pressable>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, opacity: 0.7 },
  list: { padding: 16, paddingBottom: 80 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { marginBottom: 8 },
  emptyMessage: { textAlign: 'center', opacity: 0.7 },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontWeight: '700', fontSize: 16 },
});
