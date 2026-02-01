/**
 * Household service
 * Handles household and membership CRUD operations
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
