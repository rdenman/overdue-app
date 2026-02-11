#!/usr/bin/env node
/**
 * Cleanup script for test data
 * Removes all test users, their households, and associated data
 * 
 * Usage: pnpm cleanup
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Test user emails
const TEST_USER_EMAILS = [
  'test1@test.com',
  'test2@test.com',
  'test3@test.com',
];

const TEST_PASSWORD = 'Password1!';

// Delete all chores for a household
async function deleteHouseholdChores(householdId: string): Promise<number> {
  const choresRef = collection(firestore, 'chores');
  const q = query(choresRef, where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  
  for (const choreDoc of snapshot.docs) {
    await deleteDoc(choreDoc.ref);
  }
  
  return snapshot.size;
}

// Delete all invites for a household
async function deleteHouseholdInvites(householdId: string): Promise<number> {
  const invitesRef = collection(firestore, 'invites');
  const q = query(invitesRef, where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  
  for (const inviteDoc of snapshot.docs) {
    await deleteDoc(inviteDoc.ref);
  }
  
  return snapshot.size;
}

// Delete all members of a household
async function deleteHouseholdMembers(householdId: string): Promise<number> {
  const membersRef = collection(firestore, 'householdMembers');
  const q = query(membersRef, where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('No authenticated user');
  }
  
  // Delete other members first, then the current user's membership last
  // (security rules require the current user's membership to exist for authorization)
  const otherMembers = snapshot.docs.filter(
    (doc) => doc.data().userId !== currentUserId
  );
  const currentUserMember = snapshot.docs.find(
    (doc) => doc.data().userId === currentUserId
  );
  
  // Delete other members
  for (const memberDoc of otherMembers) {
    await deleteDoc(memberDoc.ref);
  }
  
  // Delete current user's membership last
  if (currentUserMember) {
    await deleteDoc(currentUserMember.ref);
  }
  
  return snapshot.size;
}

// Delete a household and all its related data
async function deleteHousehold(householdId: string, householdName: string) {
  console.log(`\n🗑️  Deleting household: ${householdName} (${householdId})`);
  
  // Delete chores
  const choresCount = await deleteHouseholdChores(householdId);
  console.log(`  ✓ Deleted ${choresCount} chore(s)`);
  
  // Delete invites
  const invitesCount = await deleteHouseholdInvites(householdId);
  console.log(`  ✓ Deleted ${invitesCount} invite(s)`);
  
  // Delete members
  const membersCount = await deleteHouseholdMembers(householdId);
  console.log(`  ✓ Deleted ${membersCount} member(s)`);
  
  // Delete household
  await deleteDoc(doc(firestore, 'households', householdId));
  console.log(`  ✓ Deleted household`);
}

// Delete all households for a user
async function deleteUserHouseholds(userId: string): Promise<number> {
  // Find all household memberships
  const membersRef = collection(firestore, 'householdMembers');
  const q = query(membersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const householdIds = new Set<string>();
  for (const memberDoc of snapshot.docs) {
    householdIds.add(memberDoc.data().householdId);
  }
  
  let deletedCount = 0;
  
  // Delete or leave each household
  for (const householdId of Array.from(householdIds)) {
    // Get household info
    const householdDoc = await getDocs(
      query(collection(firestore, 'households'), where('__name__', '==', householdId))
    );
    
    if (!householdDoc.empty) {
      const householdData = householdDoc.docs[0].data();
      const householdName = householdData.name;
      const ownerId = householdData.ownerId;
      
      // Only delete if current user is the owner
      if (ownerId === userId) {
        await deleteHousehold(householdId, householdName);
        deletedCount++;
      } else {
        // Not the owner - just remove this user's membership
        console.log(`\n👋 Leaving household: ${householdName} (not owner)`);
        const memberId = `${householdId}_${userId}`;
        await deleteDoc(doc(firestore, 'householdMembers', memberId));
        console.log(`  ✓ Removed membership`);
      }
    }
  }
  
  return deletedCount;
}

// Delete user profile from Firestore
async function deleteUserProfile(userId: string) {
  await deleteDoc(doc(firestore, 'users', userId));
  console.log(`  ✓ Deleted user profile from Firestore`);
}

// Delete user from Firebase Auth
async function deleteUserAuth(user: FirebaseUser) {
  await deleteAuthUser(user);
}

// Main cleanup function
async function cleanup() {
  console.log('🧹 Starting cleanup script...\n');
  console.log(`Using Firebase project: ${firebaseConfig.projectId}\n`);
  
  try {
    let totalUsersDeleted = 0;
    let totalHouseholdsDeleted = 0;
    
    for (const email of TEST_USER_EMAILS) {
      console.log(`\n━━━ Processing ${email} ━━━`);
      
      try {
        // First, try to sign in as this user to get auth context
        await signInWithEmailAndPassword(auth, email, TEST_PASSWORD);
        console.log(`✓ Signed in as ${email}`);
        
        // Get current user ID from auth
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          console.log(`  ⚠️  Could not get user ID for ${email}`);
          continue;
        }
        
        // Delete households (now we have proper auth context)
        const householdCount = await deleteUserHouseholds(userId);
        totalHouseholdsDeleted += householdCount;
        console.log(`\n✓ Cleaned up ${householdCount} household(s) for ${email}`);
        
        // Delete user profile from Firestore
        console.log(`\n🗑️  Deleting user profile for ${email}`);
        await deleteUserProfile(userId);
        
        // Delete from Auth (must be last since it signs the user out)
        await deleteAuthUser(auth.currentUser!);
        console.log(`  ✓ Deleted user from Firebase Auth`);
        
        totalUsersDeleted++;
        console.log(`✓ User ${email} completely removed`);
        
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          console.log(`  ⚠️  User not found in Auth: ${email}`);
          console.log(`  ℹ️  Skipping (any shared data will be cleaned up by other users)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!\n');
    console.log('━━━ Summary ━━━');
    console.log(`Users deleted: ${totalUsersDeleted}`);
    console.log(`Households deleted: ${totalHouseholdsDeleted}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup script
cleanup();
