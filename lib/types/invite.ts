import { Timestamp } from 'firebase/firestore';
import { HouseholdRole } from './household';

/**
 * Invitation domain types
 * Represents household invitation documents
 */

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface HouseholdInvite {
  id: string;
  householdId: string;
  householdName: string;
  invitedBy: string;
  inviterName: string;
  invitedEmail: string;
  role: HouseholdRole;
  status: InviteStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface InviteCreateInput {
  householdId: string;
  invitedBy: string;
  invitedEmail: string;
  role: HouseholdRole;
}

// Extended interface for invites with household info
// Currently identical to HouseholdInvite but kept for semantic clarity
export interface InviteWithHouseholdInfo extends HouseholdInvite {}
