/**
 * Firestore data converters
 * Provides type-safe conversion between Firestore documents and TypeScript types
 */

import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions
} from 'firebase/firestore';
import { Chore } from '../types/chore';
import { Household, HouseholdMember } from '../types/household';
import { HouseholdInvite } from '../types/invite';
import { User } from '../types/user';
import {
  ChoreDocument,
  HouseholdDocument,
  HouseholdMemberDocument,
  InviteDocument,
  UserDocument,
} from './types';

/**
 * User converter
 */
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options) as UserDocument;
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      emailVerified: data.emailVerified,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Household converter
 */
export const householdConverter: FirestoreDataConverter<Household> = {
  toFirestore(household: Household): DocumentData {
    return {
      id: household.id,
      name: household.name,
      ownerId: household.ownerId,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Household {
    const data = snapshot.data(options) as HouseholdDocument;
    return {
      id: data.id,
      name: data.name,
      ownerId: data.ownerId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * HouseholdMember converter
 */
export const householdMemberConverter: FirestoreDataConverter<HouseholdMember> = {
  toFirestore(member: HouseholdMember): DocumentData {
    return {
      id: member.id,
      householdId: member.householdId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): HouseholdMember {
    const data = snapshot.data(options) as HouseholdMemberDocument;
    return {
      id: data.id,
      householdId: data.householdId,
      userId: data.userId,
      role: data.role,
      joinedAt: data.joinedAt,
    };
  },
};

/**
 * Chore converter
 */
export const choreConverter: FirestoreDataConverter<Chore> = {
  toFirestore(chore: Chore): DocumentData {
    return {
      id: chore.id,
      householdId: chore.householdId,
      name: chore.name,
      description: chore.description,
      assignedTo: chore.assignedTo,
      createdBy: chore.createdBy,
      createdAt: chore.createdAt,
      updatedAt: chore.updatedAt,
      interval: chore.interval,
      dueAt: chore.dueAt,
      isOverdue: chore.isOverdue,
      lastCompletion: chore.lastCompletion,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Chore {
    const data = snapshot.data(options) as ChoreDocument;
    return {
      id: data.id,
      householdId: data.householdId,
      name: data.name,
      description: data.description,
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      interval: data.interval,
      dueAt: data.dueAt,
      isOverdue: data.isOverdue,
      lastCompletion: data.lastCompletion,
    };
  },
};

/**
 * Invite converter
 */
export const inviteConverter: FirestoreDataConverter<HouseholdInvite> = {
  toFirestore(invite: HouseholdInvite): DocumentData {
    return {
      id: invite.id,
      householdId: invite.householdId,
      householdName: invite.householdName,
      invitedBy: invite.invitedBy,
      inviterName: invite.inviterName,
      invitedEmail: invite.invitedEmail,
      role: invite.role,
      status: invite.status,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): HouseholdInvite {
    const data = snapshot.data(options) as InviteDocument;
    return {
      id: data.id,
      householdId: data.householdId,
      householdName: data.householdName,
      invitedBy: data.invitedBy,
      inviterName: data.inviterName,
      invitedEmail: data.invitedEmail,
      role: data.role,
      status: data.status,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  },
};
