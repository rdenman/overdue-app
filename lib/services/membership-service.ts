/**
 * Household membership service
 * Handles household membership CRUD operations
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
  where,
} from '@react-native-firebase/firestore';
import { firestore } from '../firebase/config';
import { householdMemberConverter } from '../firebase/converters';
import {
  HouseholdMember,
  HouseholdMemberCreateInput,
} from '../types/household';

/**
 * Create a household membership
 */
export async function createHouseholdMember(
  input: HouseholdMemberCreateInput
): Promise<HouseholdMember> {
  try {
    const memberId = `${input.householdId}_${input.userId}`;

    const member: HouseholdMember = {
      id: memberId,
      householdId: input.householdId,
      userId: input.userId,
      role: input.role,
      joinedAt: Timestamp.now(),
    };

    await setDoc(
      doc(firestore, 'householdMembers', memberId),
      householdMemberConverter.toFirestore(member),
    );

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
    const snap = await getDoc(doc(firestore, 'householdMembers', memberId));

    return householdMemberConverter.fromSnapshot(snap);
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
    const snap = await getDocs(
      query(collection(firestore, 'householdMembers'), where('householdId', '==', householdId)),
    );

    return snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
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
    const requestingMember = await getHouseholdMember(householdId, requestingUserId);
    if (!requestingMember) {
      throw new Error('You are not a member of this household');
    }

    const isSelfRemoval = userId === requestingUserId;
    const isAdmin = requestingMember.role === 'admin';

    if (!isSelfRemoval && !isAdmin) {
      throw new Error('Only admins can remove other members');
    }

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
    await deleteDoc(doc(firestore, 'householdMembers', memberId));
  } catch (error) {
    console.error('Error removing household member:', error);
    throw error;
  }
}
