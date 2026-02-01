import { Timestamp } from 'firebase/firestore';

/**
 * User domain types
 * Represents a user profile stored in Firestore
 */

export interface User {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserCreateInput {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface UserUpdateInput {
  displayName?: string;
  emailVerified?: boolean;
  updatedAt?: Timestamp;
}
