import { Timestamp } from 'firebase/firestore';

/**
 * Household domain types
 * Represents households and membership relationships
 */

export type HouseholdRole = 'admin' | 'member';

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HouseholdCreateInput {
  name: string;
  ownerId: string;
}

export interface HouseholdUpdateInput {
  name?: string;
  updatedAt?: Timestamp;
}

export interface HouseholdMember {
  id: string; // composite: {householdId}_{userId}
  householdId: string;
  userId: string;
  role: HouseholdRole;
  joinedAt: Timestamp;
}

export interface HouseholdMemberCreateInput {
  householdId: string;
  userId: string;
  role: HouseholdRole;
}
