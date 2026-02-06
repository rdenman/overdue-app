/**
 * User React Query hooks
 * Queries for user profile operations
 */

import { useQueries } from '@tanstack/react-query';
import { getUserProfile } from '../services/user-service';
import { User } from '../types/user';
import { queryKeys } from './query-keys';

/**
 * Fetch multiple user profiles in parallel, each individually cached.
 * Returns an array of profiles in the same order as the input userIds.
 */
export function useUserProfiles(userIds: string[]) {
  const queries = useQueries({
    queries: userIds.map((uid) => ({
      queryKey: queryKeys.users.profile(uid),
      queryFn: () => getUserProfile(uid),
      enabled: !!uid,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const profiles: (User | null)[] = queries.map((q) => q.data ?? null);

  return { profiles, isLoading };
}
