/**
 * Invitation service
 * Handles household invitation CRUD operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';
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
    // Validate that inviter is an admin
    const membership = await getHouseholdMember(input.householdId, input.invitedBy);
    if (!membership || membership.role !== 'admin') {
      throw new Error('Only household admins can send invitations');
    }

    // Check for duplicate pending invites
    const existingInvites = await getDocs(
      query(
        collection(firestore, 'invites'),
        where('householdId', '==', input.householdId),
        where('invitedEmail', '==', input.invitedEmail.toLowerCase()),
        where('status', '==', 'pending')
      )
    );

    if (!existingInvites.empty) {
      throw new Error('An invitation to this email already exists for this household');
    }

    // Check if user is already a member
    // Note: We can't easily query by email, so we'll handle this on accept
    
    // Fetch household and inviter info to store in the invite
    const household = await getHousehold(input.householdId);
    const inviter = await getUserProfile(input.invitedBy);
    
    if (!household) {
      throw new Error('Household not found');
    }
    
    const inviteRef = doc(collection(firestore, 'invites'));
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

    const inviteDocRef = doc(firestore, 'invites', invite.id).withConverter(inviteConverter);
    await setDoc(inviteDocRef, invite);

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
    const invitesRef = collection(firestore, 'invites');
    const invitesQuery = query(invitesRef, where('householdId', '==', householdId));
    const invitesSnap = await getDocs(invitesQuery);

    return invitesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
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
    const invitesRef = collection(firestore, 'invites');
    const invitesQuery = query(
      invitesRef,
      where('invitedEmail', '==', email.toLowerCase()),
      where('status', '==', 'pending')
    );
    const invitesSnap = await getDocs(invitesQuery);

    const now = Timestamp.now();
    const invites: InviteWithHouseholdInfo[] = [];

    for (const docSnap of invitesSnap.docs) {
      const data = docSnap.data();
      const invite = {
        id: docSnap.id,
        ...data,
      } as HouseholdInvite;

      // Filter out expired invites
      if (invite.expiresAt.toMillis() < now.toMillis()) {
        // Mark as expired
        await updateDoc(doc(firestore, 'invites', invite.id), { status: 'expired' });
        continue;
      }

      // Household name and inviter name are now stored in the invite document
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

    if (!inviteSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invite = inviteSnap.data() as HouseholdInvite;

    // Validate status
    if (invite.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    // Check expiration
    const now = Timestamp.now();
    if (invite.expiresAt.toMillis() < now.toMillis()) {
      await updateDoc(inviteRef, { status: 'expired' });
      throw new Error('This invitation has expired');
    }

    // Check if user is already a member
    const existingMembership = await getHouseholdMember(invite.householdId, userId);
    if (existingMembership) {
      throw new Error('You are already a member of this household');
    }

    // Create household membership
    await createHouseholdMember({
      householdId: invite.householdId,
      userId: userId,
      role: invite.role,
    });

    // Update invite status
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

    if (!inviteSnap.exists()) {
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

    if (!inviteSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invite = inviteSnap.data() as HouseholdInvite;

    // Verify user is admin of the household
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
