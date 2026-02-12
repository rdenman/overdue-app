import { Timestamp } from 'firebase/firestore';

/**
 * Chore domain types
 * Represents chores, intervals, and completion tracking
 */

export type IntervalType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'
  | 'once';

export interface Interval {
  type: IntervalType;
  value: number; // For 'every N months/years' or custom duration in days
}

export interface Completion {
  completedAt: Timestamp;
  completedBy: string;
  previousDueAt: Timestamp | null; // For undo: restores dueAt to this value (null for one-off chores with no deadline)
}

export interface Chore {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  assignedTo?: string; // userId or undefined for unassigned
  roomId?: string; // Optional room assignment for location-based organization
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  interval: Interval;
  dueAt: Timestamp | null; // null for one-off chores with no deadline
  isOverdue: boolean;
  lastCompletion?: Completion;
}

export interface ChoreCreateInput {
  householdId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  roomId?: string;
  createdBy: string;
  interval: Interval;
  dueAt?: Timestamp | null; // Optional override: explicit date, or null for one-off with no deadline
}

export interface ChoreUpdateInput {
  name?: string;
  description?: string;
  assignedTo?: string;
  roomId?: string;
  interval?: Interval;
  dueAt?: Timestamp | null;
  isOverdue?: boolean;
  lastCompletion?: Completion;
  updatedAt?: Timestamp;
}
