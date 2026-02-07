/**
 * Chore React Query hooks
 * Queries and mutations for chore operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeChore,
  createChore,
  deleteChore,
  getChore,
  getChoresForHouseholds,
  getHouseholdChores,
  undoCompletion,
  updateChore,
} from '../services/chore-service';
import { ChoreCreateInput, ChoreUpdateInput } from '../types/chore';
import { queryKeys } from './query-keys';

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

// ── Mutations ──

export function useCreateChore(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChoreCreateInput) => createChore(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
    },
  });
}

export function useUpdateChore(choreId: string, householdId: string) {
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
    },
  });
}

export function useDeleteChore(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choreId: string) => deleteChore(choreId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(householdId),
      });
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
    },
  });
}
