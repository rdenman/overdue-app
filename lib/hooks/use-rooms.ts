/**
 * Room React Query hooks
 * Queries and mutations for room operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRoom,
  deleteRoom,
  getHouseholdRooms,
  getRoom,
  updateRoom,
} from '../services/room-service';
import { RoomCreateInput, RoomUpdateInput } from '../types/room';
import { queryKeys } from './query-keys';

// ── Queries ──

export function useHouseholdRooms(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.household(householdId ?? ''),
    queryFn: () => getHouseholdRooms(householdId!),
    enabled: !!householdId,
  });
}

export function useRoom(householdId: string | undefined, roomId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(householdId ?? '', roomId ?? ''),
    queryFn: () => getRoom(householdId!, roomId!),
    enabled: !!householdId && !!roomId,
  });
}

// ── Mutations ──

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RoomCreateInput) => createRoom(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.household(variables.householdId),
      });
    },
  });
}

export function useUpdateRoom(householdId: string, roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: RoomUpdateInput) =>
      updateRoom(householdId, roomId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.household(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.detail(householdId, roomId),
      });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      householdId,
      roomId,
      requestingUserId,
    }: {
      householdId: string;
      roomId: string;
      requestingUserId: string;
    }) => deleteRoom(householdId, roomId, requestingUserId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.household(variables.householdId),
      });
      // Invalidate chores since deleting a room deletes associated chores
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.household(variables.householdId),
      });
    },
  });
}
