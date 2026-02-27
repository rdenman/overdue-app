/**
 * Firestore data converters
 * Provides type-safe conversion between Firestore document snapshots and TypeScript types.
 * React Native Firebase does not support withConverter(), so these are plain helper functions.
 */

import { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
import { Chore } from '../types/chore';
import { Household, HouseholdMember } from '../types/household';
import { HouseholdInvite } from '../types/invite';
import { Room } from '../types/room';
import { User } from '../types/user';
import {
  ChoreDocument,
  HouseholdDocument,
  HouseholdMemberDocument,
  InviteDocument,
  RoomDocument,
  UserDocument,
} from './types';

/**
 * User converter
 */
export const userConverter = {
  toFirestore(user: User): Record<string, unknown> {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
  fromSnapshot(snapshot: DocumentSnapshot): User | null {
    const data = snapshot.data() as UserDocument | undefined;
    if (!data) return null;
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
export const householdConverter = {
  toFirestore(household: Household): Record<string, unknown> {
    return {
      id: household.id,
      name: household.name,
      ownerId: household.ownerId,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  },
  fromSnapshot(snapshot: DocumentSnapshot): Household | null {
    const data = snapshot.data() as HouseholdDocument | undefined;
    if (!data) return null;
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
export const householdMemberConverter = {
  toFirestore(member: HouseholdMember): Record<string, unknown> {
    return {
      id: member.id,
      householdId: member.householdId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  },
  fromSnapshot(snapshot: DocumentSnapshot): HouseholdMember | null {
    const data = snapshot.data() as HouseholdMemberDocument | undefined;
    if (!data) return null;
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
 * Room converter
 */
export const roomConverter = {
  toFirestore(room: Room): Record<string, unknown> {
    return {
      id: room.id,
      householdId: room.householdId,
      name: room.name,
      isDefault: room.isDefault,
      sortOrder: room.sortOrder,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  },
  fromSnapshot(snapshot: DocumentSnapshot): Room | null {
    const data = snapshot.data() as RoomDocument | undefined;
    if (!data) return null;
    return {
      id: data.id,
      householdId: data.householdId,
      name: data.name,
      isDefault: data.isDefault,
      sortOrder: data.sortOrder,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Chore converter
 */
export const choreConverter = {
  toFirestore(chore: Chore): Record<string, unknown> {
    const data: Record<string, unknown> = {
      id: chore.id,
      householdId: chore.householdId,
      name: chore.name,
      createdBy: chore.createdBy,
      createdAt: chore.createdAt,
      updatedAt: chore.updatedAt,
      interval: chore.interval,
      dueAt: chore.dueAt ?? null,
      isOverdue: chore.isOverdue,
    };

    if (chore.description !== undefined) data.description = chore.description;
    if (chore.assignedTo !== undefined) data.assignedTo = chore.assignedTo;
    if (chore.roomId !== undefined) data.roomId = chore.roomId;
    if (chore.lastCompletion !== undefined) data.lastCompletion = chore.lastCompletion;

    return data;
  },
  fromSnapshot(snapshot: DocumentSnapshot): Chore | null {
    const data = snapshot.data() as ChoreDocument | undefined;
    if (!data) return null;
    return {
      id: data.id,
      householdId: data.householdId,
      name: data.name,
      description: data.description,
      assignedTo: data.assignedTo,
      roomId: data.roomId,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      interval: data.interval,
      dueAt: data.dueAt ?? null,
      isOverdue: data.isOverdue,
      lastCompletion: data.lastCompletion,
    };
  },
};

/**
 * Invite converter
 */
export const inviteConverter = {
  toFirestore(invite: HouseholdInvite): Record<string, unknown> {
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
  fromSnapshot(snapshot: DocumentSnapshot): HouseholdInvite | null {
    const data = snapshot.data() as InviteDocument | undefined;
    if (!data) return null;
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
