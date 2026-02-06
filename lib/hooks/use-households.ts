/**
 * Household React Query hooks
 * Queries and mutations for household and membership operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHousehold,
  deleteHousehold,
  getHousehold,
  getHouseholdMember,
  getHouseholdMembers,
  getUserHouseholds,
  removeHouseholdMember,
  updateHousehold,
} from '../services/household-service';
import { HouseholdCreateInput, HouseholdUpdateInput } from '../types/household';
import { queryKeys } from './query-keys';

// ── Queries ──

export function useUserHouseholds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.households.all(userId ?? ''),
    queryFn: () => getUserHouseholds(userId!),
    enabled: !!userId,
  });
}

export function useHousehold(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.households.detail(id ?? ''),
    queryFn: () => getHousehold(id!),
    enabled: !!id,
  });
}

export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.households.members(householdId ?? ''),
    queryFn: () => getHouseholdMembers(householdId!),
    enabled: !!householdId,
  });
}

export function useCurrentUserMembership(
  householdId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.households.member(householdId ?? '', userId ?? ''),
    queryFn: () => getHouseholdMember(householdId!, userId!),
    enabled: !!householdId && !!userId,
  });
}

// ── Mutations ──

export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HouseholdCreateInput) => createHousehold(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.all(variables.ownerId),
      });
    },
  });
}

export function useUpdateHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: HouseholdUpdateInput) =>
      updateHousehold(householdId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.detail(householdId),
      });
    },
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      householdId,
      userId,
    }: {
      householdId: string;
      userId: string;
    }) => deleteHousehold(householdId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.all(variables.userId),
      });
    },
  });
}

export function useRemoveHouseholdMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      requestingUserId,
    }: {
      userId: string;
      requestingUserId: string;
    }) => removeHouseholdMember(householdId, userId, requestingUserId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.members(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.all(variables.requestingUserId),
      });
    },
  });
}
