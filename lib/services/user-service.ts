/**
 * User service
 * Handles user profile CRUD operations in Firestore
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { userConverter } from '../firebase/converters';
import { User, UserCreateInput, UserUpdateInput } from '../types/user';

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userRef = doc(firestore, 'users', uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to load user profile');
  }
}

/**
 * Create a new user profile
 * Called after successful Firebase Auth sign-up
 */
export async function createUserProfile(input: UserCreateInput): Promise<User> {
  try {
    const now = Timestamp.now();
    const user: User = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    
    const userRef = doc(firestore, 'users', input.uid).withConverter(userConverter);
    await setDoc(userRef, user);
    
    return user;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: UserUpdateInput
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}
