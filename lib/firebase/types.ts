/**
 * Firestore document shapes
 * These represent the actual structure stored in Firestore
 * Timestamps are stored as Firestore Timestamp objects
 */

import { Timestamp } from 'firebase/firestore';
import { IntervalType } from '../types/chore';
import { HouseholdRole } from '../types/household';

/**
 * User document shape in Firestore: /users/{uid}
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Household document shape in Firestore: /households/{householdId}
 */
export interface HouseholdDocument {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * HouseholdMember document shape in Firestore: /householdMembers/{memberId}
 * memberId format: {householdId}_{userId}
 */
export interface HouseholdMemberDocument {
  id: string;
  householdId: string;
  userId: string;
  role: HouseholdRole;
  joinedAt: Timestamp;
}

/**
 * Chore document shape in Firestore: /chores/{choreId}
 */
export interface ChoreDocument {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  interval: {
    type: IntervalType;
    value: number;
  };
  dueAt: Timestamp;
  isOverdue: boolean;
  lastCompletion?: {
    completedAt: Timestamp;
    completedBy: string;
  };
}

/**
 * Invite document shape in Firestore: /invites/{inviteId}
 */
export interface InviteDocument {
  id: string;
  householdId: string;
  householdName: string;
  invitedBy: string;
  inviterName: string;
  invitedEmail: string;
  role: HouseholdRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
