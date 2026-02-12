/**
 * Chore React Query hooks
 * Queries and mutations for chore operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  completeChore,
  createChore,
  deleteChore,
  getChore,
  getChoresForHouseholds,
  getHouseholdChores,
  isChoreOverdue,
  undoCompletion,
  updateChore,
} from '../services/chore-service';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  scheduleAllNotifications,
} from '../services/notification-service';
import { Chore, ChoreCreateInput, ChoreUpdateInput } from '../types/chore';
import { queryKeys } from './query-keys';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

// ── Types ──

export interface HouseholdChoreStats {
  total: number;
  overdue: number;
  dueToday: number;
}

// ── Queries ──

export function useHouseholdChores(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chores.household(householdId ?? ''),
    queryFn: () => getHouseholdChores(householdId!),
    enabled: !!householdId,
  });
}

export function useChore(choreId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chores.detail(choreId ?? ''),
    queryFn: () => getChore(choreId!),
    enabled: !!choreId,
  });
}

export function useTodayChores(
  userId: string | undefined,
  householdIds: string[]
) {
  return useQuery({
    queryKey: queryKeys.chores.today(userId ?? ''),
    queryFn: () => getChoresForHouseholds(householdIds),
    enabled: !!userId && householdIds.length > 0,
  });
}

/**
 * Fetch chores across all households and compute per-household stats.
 * Returns a map of householdId → { total, overdue, dueToday }.
 */
export function useAllHouseholdChoreStats(
  userId: string | undefined,
  householdIds: string[]
) {
  const query = useQuery({
    queryKey: queryKeys.chores.allHouseholds(userId ?? ''),
    queryFn: () => getChoresForHouseholds(householdIds),
    enabled: !!userId && householdIds.length > 0,
  });

  const statsMap = useMemo(() => {
    const map: Record<string, HouseholdChoreStats> = {};
    if (!query.data) return map;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    for (const chore of query.data) {
      if (!map[chore.householdId]) {
        map[chore.householdId] = { total: 0, overdue: 0, dueToday: 0 };
      }
      const stats = map[chore.householdId];
      stats.total++;
      if (isChoreOverdue(chore)) {
        stats.overdue++;
      }
      if (chore.dueAt) {
        const dueDate = chore.dueAt.toDate();
        if (dueDate >= todayStart && dueDate < todayEnd && !chore.lastCompletion) {
          stats.dueToday++;
        }
      }
    }
    return map;
  }, [query.data]);

  return { statsMap, isLoading: query.isLoading };
}

// ── Notification Sync ──

/**
 * Read notification settings from AsyncStorage and re-schedule all notifications
 * using the latest chore data from the query cache.
 */
async function syncNotificationsFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string
) {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    const settings: NotificationSettings = raw
      ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) }
      : DEFAULT_NOTIFICATION_SETTINGS;

    // Get cached chores from allHouseholds or today query
    const chores =
      queryClient.getQueryData<Chore[]>(queryKeys.chores.allHouseholds(userId)) ??
      queryClient.getQueryData<Chore[]>(queryKeys.chores.today(userId)) ??
      [];

    await scheduleAllNotifications(chores, settings);
  } catch {
    // Silently fail — notifications will sync on next app open
  }
}

// ── Mutations ──

export function useCreateChore(householdId: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChoreCreateInput) => createChore(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
      if (userId) syncNotificationsFromCache(queryClient, userId);
    },
  });
}

export function useUpdateChore(choreId: string, householdId: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ChoreUpdateInput) => updateChore(choreId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.detail(choreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
      if (userId) syncNotificationsFromCache(queryClient, userId);
    },
  });
}

export function useDeleteChore(householdId: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choreId: string) => deleteChore(choreId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
      if (userId) syncNotificationsFromCache(queryClient, userId);
    },
  });
}

export function useCompleteChore(householdId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choreId: string) => completeChore(choreId, userId),
    onSuccess: (_data, choreId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.detail(choreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.today(userId),
      });
      syncNotificationsFromCache(queryClient, userId);
    },
  });
}

export function useUndoCompletion(householdId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choreId: string) => undoCompletion(choreId),
    onSuccess: (_data, choreId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.detail(choreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.today(userId),
      });
      syncNotificationsFromCache(queryClient, userId);
    },
  });
}
