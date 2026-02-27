/**
 * Invitation service
 * Handles household invitation CRUD operations
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { firestore } from '../firebase/config';
import { inviteConverter } from '../firebase/converters';
import {
  HouseholdInvite,
  InviteCreateInput,
  InviteWithHouseholdInfo,
} from '../types/invite';
import { getHousehold, getHouseholdMember, createHouseholdMember } from './household-service';
import { getUserProfile } from './user-service';

/**
 * Create a new household invitation
 * Note: This should only be called when online (per PROJECT_CHARTER)
 */
export async function createInvite(input: InviteCreateInput): Promise<HouseholdInvite> {
  try {
    const membership = await getHouseholdMember(input.householdId, input.invitedBy);
    if (!membership || membership.role !== 'admin') {
      throw new Error('Only household admins can send invitations');
    }

    const existingInvites = await getDocs(
      query(
        collection(firestore, 'invites'),
        where('householdId', '==', input.householdId),
        where('invitedEmail', '==', input.invitedEmail.toLowerCase()),
        where('status', '==', 'pending'),
      ),
    );

    if (!existingInvites.empty) {
      throw new Error('An invitation to this email already exists for this household');
    }

    const household = await getHousehold(input.householdId);
    const inviter = await getUserProfile(input.invitedBy);

    if (!household) {
      throw new Error('Household not found');
    }

    const inviteRef = doc(collection(firestore, 'invites'));
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);

    const invite: HouseholdInvite = {
      id: inviteRef.id,
      householdId: input.householdId,
      householdName: household.name,
      invitedBy: input.invitedBy,
      inviterName: inviter?.displayName || 'Unknown',
      invitedEmail: input.invitedEmail.toLowerCase(),
      role: input.role,
      status: 'pending',
      createdAt: now,
      expiresAt: expiresAt,
    };

    await setDoc(inviteRef, inviteConverter.toFirestore(invite));

    return invite;
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
}

/**
 * Get all invites for a household
 */
export async function getInvitesForHousehold(householdId: string): Promise<HouseholdInvite[]> {
  try {
    const snap = await getDocs(
      query(collection(firestore, 'invites'), where('householdId', '==', householdId)),
    );

    return snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
      } as HouseholdInvite;
    });
  } catch (error) {
    console.error('Error getting household invites:', error);
    throw new Error('Failed to load invitations');
  }
}

/**
 * Get pending invites for a specific email address
 */
export async function getPendingInvitesForEmail(
  email: string
): Promise<InviteWithHouseholdInfo[]> {
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'invites'),
        where('invitedEmail', '==', email.toLowerCase()),
        where('status', '==', 'pending'),
      ),
    );

    const now = Timestamp.now();
    const invites: InviteWithHouseholdInfo[] = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const invite = {
        id: docSnap.id,
        ...data,
      } as HouseholdInvite;

      if (invite.expiresAt.toMillis() < now.toMillis()) {
        await updateDoc(doc(firestore, 'invites', invite.id), { status: 'expired' });
        continue;
      }

      invites.push(invite);
    }

    return invites;
  } catch (error) {
    console.error('Error getting pending invites:', error);
    throw new Error('Failed to load invitations');
  }
}

/**
 * Accept a household invitation
 * Note: This should only be called when online (per PROJECT_CHARTER)
 */
export async function acceptInvite(inviteId: string, userId: string): Promise<void> {
  try {
    const inviteRef = doc(firestore, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists) {
      throw new Error('Invitation not found');
    }

    const invite = inviteSnap.data() as HouseholdInvite;

    if (invite.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    const now = Timestamp.now();
    if (invite.expiresAt.toMillis() < now.toMillis()) {
      await updateDoc(inviteRef, { status: 'expired' });
      throw new Error('This invitation has expired');
    }

    const existingMembership = await getHouseholdMember(invite.householdId, userId);
    if (existingMembership) {
      throw new Error('You are already a member of this household');
    }

    await createHouseholdMember({
      householdId: invite.householdId,
      userId: userId,
      role: invite.role,
    });

    await updateDoc(inviteRef, { status: 'accepted' });
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}

/**
 * Decline a household invitation
 * Note: This should only be called when online (per PROJECT_CHARTER)
 */
export async function declineInvite(inviteId: string): Promise<void> {
  try {
    const inviteRef = doc(firestore, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists) {
      throw new Error('Invitation not found');
    }

    const invite = inviteSnap.data() as HouseholdInvite;

    if (invite.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    await updateDoc(inviteRef, { status: 'declined' });
  } catch (error) {
    console.error('Error declining invite:', error);
    throw error;
  }
}

/**
 * Delete an invitation (admin only)
 */
export async function deleteInvite(inviteId: string, userId: string): Promise<void> {
  try {
    const inviteRef = doc(firestore, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists) {
      throw new Error('Invitation not found');
    }

    const invite = inviteSnap.data() as HouseholdInvite;

    const membership = await getHouseholdMember(invite.householdId, userId);
    if (!membership || membership.role !== 'admin') {
      throw new Error('Only household admins can delete invitations');
    }

    await deleteDoc(inviteRef);
  } catch (error) {
    console.error('Error deleting invite:', error);
    throw error;
  }
}
