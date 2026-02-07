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
  | 'custom';

export interface Interval {
  type: IntervalType;
  value: number; // For 'every N months/years' or custom duration in days
}

export interface Completion {
  completedAt: Timestamp;
  completedBy: string;
  previousDueAt: Timestamp; // For undo: restores dueAt to this value
}

export interface Chore {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  assignedTo?: string; // userId or undefined for unassigned
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  interval: Interval;
  dueAt: Timestamp;
  isOverdue: boolean;
  lastCompletion?: Completion;
}

export interface ChoreCreateInput {
  householdId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  createdBy: string;
  interval: Interval;
}

export interface ChoreUpdateInput {
  name?: string;
  description?: string;
  assignedTo?: string;
  interval?: Interval;
  dueAt?: Timestamp;
  isOverdue?: boolean;
  lastCompletion?: Completion;
  updatedAt?: Timestamp;
}
