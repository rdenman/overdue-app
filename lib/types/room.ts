import { Timestamp } from '@react-native-firebase/firestore';

/**
 * Room domain types
 * Represents rooms within a household for organizing chores by location
 */

export interface Room {
  id: string;
  householdId: string;
  name: string;
  isDefault: boolean; // Identifies auto-created rooms vs custom ones (informational only)
  sortOrder: number; // For consistent display ordering
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoomCreateInput {
  householdId: string;
  name: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface RoomUpdateInput {
  name?: string;
  sortOrder?: number;
  updatedAt?: Timestamp;
}
