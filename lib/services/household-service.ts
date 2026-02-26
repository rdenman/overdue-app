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
import { householdConverter } from '../firebase/converters';
import {
  Household,
  HouseholdCreateInput,
  HouseholdUpdateInput,
} from '../types/household';
import { createDefaultRooms } from './room-service';
import {
  createHouseholdMember,
  getHouseholdMembers,
} from './membership-service';

export {
  createHouseholdMember,
  getHouseholdMember,
  getHouseholdMembers,
  removeHouseholdMember,
} from './membership-service';

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
