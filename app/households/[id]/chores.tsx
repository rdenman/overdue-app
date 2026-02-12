/**
 * Household Chores List Screen
 * Shows all chores in a household sorted by due date (overdue first)
 */

import { ChoreCard } from '@/components/chore-card';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCompleteChore,
  useHouseholdChores,
  useUndoCompletion,
} from '@/lib/hooks/use-chores';
import { useHousehold, useHouseholdMembers } from '@/lib/hooks/use-households';
import { useHouseholdRooms } from '@/lib/hooks/use-rooms';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { isChoreOverdue } from '@/lib/services/chore-service';
import { Chore } from '@/lib/types/chore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

export default function HouseholdChoresScreen() {
  const { id: householdId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const { data: household } = useHousehold(householdId);
  const {
    data: chores = [],
    isLoading,
    refetch,
  } = useHouseholdChores(householdId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles } = useUserProfiles(memberUserIds);
  const { data: rooms = [] } = useHouseholdRooms(householdId);

  const completeMutation = useCompleteChore(householdId ?? '', user?.uid ?? '');
  const undoMutation = useUndoCompletion(householdId ?? '', user?.uid ?? '');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Filter by room and sort: overdue first, then by dueAt ascending, no-deadline chores last
  const sortedChores = useMemo(() => {
    const filtered = selectedRoomId
      ? chores.filter((c) => c.roomId === selectedRoomId)
      : chores;

    return [...filtered].sort((a, b) => {
      // Push null dueAt to the bottom
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      const aOverdue = isChoreOverdue(a);
      const bOverdue = isChoreOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return a.dueAt.toMillis() - b.dueAt.toMillis();
    });
  }, [chores, selectedRoomId]);

  const getAssigneeName = useCallback(
    (assignedTo?: string) => {
      if (!assignedTo) return undefined;
      const idx = memberUserIds.indexOf(assignedTo);
      return idx >= 0 ? profiles[idx]?.displayName ?? 'User' : undefined;
    },
    [memberUserIds, profiles]
  );

  const getRoomName = useCallback(
    (roomId?: string) => {
      if (!roomId) return undefined;
      const room = rooms.find((r) => r.id === roomId);
      return room?.name;
    },
    [rooms]
  );

  const renderChore = useCallback(
    ({ item }: { item: Chore }) => (
      <ChoreCard
        chore={item}
        assigneeName={getAssigneeName(item.assignedTo)}
        roomName={getRoomName(item.roomId)}
        onPress={() =>
          router.push(`/households/${householdId}/chore/${item.id}`)
        }
        onComplete={() => completeMutation.mutate(item.id)}
        onUndo={() => undoMutation.mutate(item.id)}
      />
    ),
    [getAssigneeName, getRoomName, householdId, router, completeMutation, undoMutation]
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
              style={{ padding: 4 }}
            >
              <IconSymbol name="gearshape.fill" size={22} color={tintColor} />
            </Pressable>
          ),
        }}
      />
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {isLoading ? (
          <LoadingState message="Loading chores..." style={styles.center} />
        ) : (
          <>
            {/* Room filter chips */}
            {rooms.length > 0 && (
              <View style={styles.filterRow}>
                <Chip
                  label="All"
                  selected={selectedRoomId === null}
                  onPress={() => setSelectedRoomId(null)}
                />
                {rooms.map((room) => (
                  <Chip
                    key={room.id}
                    label={room.name}
                    selected={selectedRoomId === room.id}
                    onPress={() => setSelectedRoomId(room.id)}
                  />
                ))}
              </View>
            )}

            <FlatList
              data={sortedChores}
              keyExtractor={(item) => item.id}
              renderItem={renderChore}
              contentContainerStyle={styles.list}
              refreshing={isLoading}
              onRefresh={refetch}
              ListEmptyComponent={
                <EmptyState
                  title="No chores yet"
                  message="Tap the button below to create your first chore."
                />
              }
            />
          </>
        )}

        {/* Floating create button */}
        <Button
          title="+ New Chore"
          onPress={() =>
            router.push(`/households/${householdId}/create-chore`)
          }
          style={styles.fab}
          textStyle={styles.fabText}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: { padding: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 24,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontWeight: '700' },
});
