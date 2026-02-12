/**
 * Household service
 * Handles household and membership CRUD operations
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
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { householdConverter, householdMemberConverter } from '../firebase/converters';
import {
  Household,
  HouseholdCreateInput,
  HouseholdMember,
  HouseholdMemberCreateInput,
  HouseholdUpdateInput,
} from '../types/household';
import { createDefaultRooms } from './room-service';

/**
 * Create a new household
 */
export async function createHousehold(input: HouseholdCreateInput): Promise<Household> {
  try {
    const householdRef = doc(collection(firestore, 'households'));
    const now = Timestamp.now();
    
    const household: Household = {
      id: householdRef.id,
      name: input.name,
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now,
    };
    
    const householdDocRef = doc(firestore, 'households', household.id).withConverter(
      householdConverter
    );
    await setDoc(householdDocRef, household);
    
    // Create membership for the owner
    await createHouseholdMember({
      householdId: household.id,
      userId: input.ownerId,
      role: 'admin',
    });
    
    // Create default rooms for the household
    await createDefaultRooms(household.id);
    
    return household;
  } catch (error) {
    console.error('Error creating household:', error);
    throw new Error('Failed to create household');
  }
}

/**
 * Create a default "Personal" household for a new user
 */
export async function createDefaultHousehold(userId: string): Promise<Household> {
  return createHousehold({
    name: 'Personal',
    ownerId: userId,
  });
}

/**
 * Get household by ID
 */
export async function getHousehold(householdId: string): Promise<Household | null> {
  try {
    const householdRef = doc(firestore, 'households', householdId).withConverter(
      householdConverter
    );
    const householdSnap = await getDoc(householdRef);
    
    if (householdSnap.exists()) {
      return householdSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting household:', error);
    throw new Error('Failed to load household');
  }
}

/**
 * Update household
 */
export async function updateHousehold(
  householdId: string,
  updates: HouseholdUpdateInput
): Promise<void> {
  try {
    const householdRef = doc(firestore, 'households', householdId);
    await updateDoc(householdRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating household:', error);
    throw new Error('Failed to update household');
  }
}

/**
 * Get all households for a user
 */
export async function getUserHouseholds(userId: string): Promise<Household[]> {
  try {
    // First, get all household memberships for the user
    const membersRef = collection(firestore, 'householdMembers');
    const membersQuery = query(membersRef, where('userId', '==', userId));
    const membersSnap = await getDocs(membersQuery);
    
    if (membersSnap.empty) {
      return [];
    }
    
    // Get household IDs from memberships
    const householdIds = membersSnap.docs.map(
      (doc) => doc.data().householdId
    );
    
    // Fetch all households
    const households: Household[] = [];
    for (const householdId of householdIds) {
      const household = await getHousehold(householdId);
      if (household) {
        households.push(household);
      }
    }
    
    return households;
  } catch (error) {
    console.error('Error getting user households:', error);
    throw new Error('Failed to load households');
  }
}

/**
 * Create a household membership
 */
export async function createHouseholdMember(
  input: HouseholdMemberCreateInput
): Promise<HouseholdMember> {
  try {
    const memberId = `${input.householdId}_${input.userId}`;
    const memberRef = doc(firestore, 'householdMembers', memberId).withConverter(
      householdMemberConverter
    );
    
    const member: HouseholdMember = {
      id: memberId,
      householdId: input.householdId,
      userId: input.userId,
      role: input.role,
      joinedAt: Timestamp.now(),
    };
    
    await setDoc(memberRef, member);
    return member;
  } catch (error) {
    console.error('Error creating household member:', error);
    throw new Error('Failed to add member to household');
  }
}

/**
 * Get household member by composite ID
 */
export async function getHouseholdMember(
  householdId: string,
  userId: string
): Promise<HouseholdMember | null> {
  try {
    const memberId = `${householdId}_${userId}`;
    const memberRef = doc(firestore, 'householdMembers', memberId).withConverter(
      householdMemberConverter
    );
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      return memberSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting household member:', error);
    throw new Error('Failed to load household member');
  }
}

/**
 * Get all members of a household
 */
export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  try {
    const membersRef = collection(firestore, 'householdMembers');
    const membersQuery = query(membersRef, where('householdId', '==', householdId));
    const membersSnap = await getDocs(membersQuery);
    
    return membersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as HouseholdMember;
    });
  } catch (error) {
    console.error('Error getting household members:', error);
    throw new Error('Failed to load household members');
  }
}

/**
 * Remove a member from a household
 */
export async function removeHouseholdMember(
  householdId: string,
  userId: string,
  requestingUserId: string
): Promise<void> {
  try {
    // Verify requesting user is either removing themselves or is an admin
    const requestingMember = await getHouseholdMember(householdId, requestingUserId);
    if (!requestingMember) {
      throw new Error('You are not a member of this household');
    }

    const isSelfRemoval = userId === requestingUserId;
    const isAdmin = requestingMember.role === 'admin';

    if (!isSelfRemoval && !isAdmin) {
      throw new Error('Only admins can remove other members');
    }

    // If removing self and is admin, check if last admin
    if (isSelfRemoval && isAdmin) {
      const members = await getHouseholdMembers(householdId);
      const adminCount = members.filter((m) => m.role === 'admin').length;
      
      if (adminCount === 1) {
        throw new Error(
          'Cannot leave household as the last admin. Please delete the household or promote another member to admin first.'
        );
      }
    }

    const memberId = `${householdId}_${userId}`;
    const memberRef = doc(firestore, 'householdMembers', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    console.error('Error removing household member:', error);
    throw error;
  }
}

/**
 * Delete a household and all related data
 * Only the owner can delete a household
 */
export async function deleteHousehold(
  householdId: string,
  requestingUserId: string
): Promise<void> {
  try {
    // Verify requesting user is the owner
    const household = await getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    if (household.ownerId !== requestingUserId) {
      throw new Error('Only the household owner can delete the household');
    }

    // Delete invites first (while owner's membership still exists for security rules)
    const invitesRef = collection(firestore, 'invites');
    const invitesQuery = query(invitesRef, where('householdId', '==', householdId));
    const invitesSnap = await getDocs(invitesQuery);
    for (const inviteDoc of invitesSnap.docs) {
      await deleteDoc(inviteDoc.ref);
    }

    // Delete chores (while owner's membership still exists for security rules)
    const choresRef = collection(firestore, 'chores');
    const choresQuery = query(choresRef, where('householdId', '==', householdId));
    const choresSnap = await getDocs(choresQuery);
    for (const choreDoc of choresSnap.docs) {
      await deleteDoc(choreDoc.ref);
    }

    // Delete all rooms in the household
    const roomsRef = collection(firestore, 'households', householdId, 'rooms');
    const roomsSnap = await getDocs(roomsRef);
    for (const roomDoc of roomsSnap.docs) {
      await deleteDoc(roomDoc.ref);
    }

    // Delete all household members, but delete the owner's membership last
    // (security rules require the owner's membership to exist for admin checks)
    const members = await getHouseholdMembers(householdId);
    const otherMembers = members.filter((m) => m.userId !== requestingUserId);
    const ownerMember = members.find((m) => m.userId === requestingUserId);

    for (const member of otherMembers) {
      await deleteDoc(doc(firestore, 'householdMembers', member.id));
    }
    if (ownerMember) {
      await deleteDoc(doc(firestore, 'householdMembers', ownerMember.id));
    }

    // Finally, delete the household itself
    await deleteDoc(doc(firestore, 'households', householdId));
  } catch (error) {
    console.error('Error deleting household:', error);
    throw error;
  }
}
