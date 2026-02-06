/**
 * Centralized query key factory
 * Provides type-safe, consistent query keys for cache management and invalidation
 */

export const queryKeys = {
  households: {
    all: (userId: string) => ['households', userId] as const,
    detail: (id: string) => ['households', 'detail', id] as const,
    members: (id: string) => ['households', 'members', id] as const,
    member: (householdId: string, userId: string) =>
      ['households', 'member', householdId, userId] as const,
  },
  invites: {
    pending: (email: string) => ['invites', 'pending', email] as const,
    forHousehold: (householdId: string) =>
      ['invites', 'household', householdId] as const,
  },
  users: {
    profile: (uid: string) => ['users', uid] as const,
  },
};
