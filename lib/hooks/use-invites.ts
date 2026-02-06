/**
 * Invite React Query hooks
 * Queries and mutations for household invitation operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptInvite,
  createInvite,
  declineInvite,
  deleteInvite,
  getInvitesForHousehold,
  getPendingInvitesForEmail,
} from '../services/invite-service';
import { InviteCreateInput } from '../types/invite';
import { queryKeys } from './query-keys';

// ── Queries ──

export function usePendingInvites(email: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.invites.pending(email ?? ''),
    queryFn: () => getPendingInvitesForEmail(email!),
    enabled: !!email,
  });
}

export function useHouseholdInvites(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invites.forHousehold(householdId ?? ''),
    queryFn: () => getInvitesForHousehold(householdId!),
    enabled: !!householdId,
  });
}

// ── Mutations ──

export function useAcceptInvite(userEmail: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inviteId,
      userId,
    }: {
      inviteId: string;
      userId: string;
    }) => acceptInvite(inviteId, userId),
    onSuccess: (_data, variables) => {
      if (userEmail) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.invites.pending(userEmail),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.households.all(variables.userId),
      });
    },
  });
}

export function useDeclineInvite(userEmail: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => declineInvite(inviteId),
    onSuccess: () => {
      if (userEmail) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.invites.pending(userEmail),
        });
      }
    },
  });
}

export function useCreateInvite(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteCreateInput) => createInvite(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invites.forHousehold(householdId),
      });
    },
  });
}

export function useDeleteInvite(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inviteId,
      userId,
    }: {
      inviteId: string;
      userId: string;
    }) => deleteInvite(inviteId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invites.forHousehold(householdId),
      });
    },
  });
}
