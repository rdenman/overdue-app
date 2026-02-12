#!/usr/bin/env node
/**
 * Seed script for local development
 * Creates test users, households, and chores
 * 
 * Usage: pnpm seed
 */

import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getFirestore,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
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

// Test user configuration
const TEST_USERS = [
  { email: 'test1@test.com', password: 'Password1!', displayName: 'Test User 1' },
  { email: 'test2@test.com', password: 'Password1!', displayName: 'Test User 2' },
  { email: 'test3@test.com', password: 'Password1!', displayName: 'Test User 3' },
];

// Chore name templates for variety
const CHORE_NAMES = [
  'Take out trash',
  'Do laundry',
  'Vacuum living room',
  'Clean bathroom',
  'Water plants',
  'Wash dishes',
  'Mop floors',
  'Dust shelves',
  'Clean kitchen',
  'Change bed sheets',
  'Clean windows',
  'Organize closet',
  'Wipe counters',
  'Empty dishwasher',
  'Clean fridge',
  'Sweep garage',
  'Clean mirrors',
  'Take out recycling',
  'Vacuum bedroom',
  'Tidy living room',
  'Clean oven',
  'Sanitize doorknobs',
  'Clean microwave',
  'Organize pantry',
  'Scrub sink',
];

const DESCRIPTIONS = [
  'Make sure to use the right cleaning products',
  'Don\'t forget to check under the furniture',
  'This needs to be done thoroughly',
  'Pay special attention to corners',
  null, // Some chores won't have descriptions
  null,
  'Use the vacuum with the HEPA filter',
  null,
  'Remember to wipe down all surfaces',
  null,
];

interface IntervalType {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'once';
  value: number;
}

const INTERVALS: IntervalType[] = [
  { type: 'daily', value: 1 },
  { type: 'daily', value: 2 },
  { type: 'weekly', value: 1 },
  { type: 'weekly', value: 2 },
  { type: 'monthly', value: 1 },
  { type: 'monthly', value: 3 },
  { type: 'custom', value: 10 }, // Every 10 days
  { type: 'custom', value: 14 }, // Every 2 weeks
  { type: 'once', value: 1 },    // One-off chore
];

// One-off chore names
const ONE_OFF_CHORE_NAMES = [
  'Replace front door',
  'Fix leaky faucet',
  'Paint bedroom',
  'Install new shelves',
  'Fix broken fence',
  'Replace smoke detector batteries',
];

// Helper to calculate due date
function calculateDueDate(interval: IntervalType, daysOffset: number): Date {
  const now = new Date();
  const dueDate = new Date(now);
  
  switch (interval.type) {
    case 'daily':
      dueDate.setDate(dueDate.getDate() + (interval.value + daysOffset));
      break;
    case 'weekly':
      dueDate.setDate(dueDate.getDate() + (interval.value * 7 + daysOffset));
      break;
    case 'monthly':
      dueDate.setMonth(dueDate.getMonth() + interval.value);
      dueDate.setDate(dueDate.getDate() + daysOffset);
      break;
    case 'yearly':
      dueDate.setFullYear(dueDate.getFullYear() + interval.value);
      dueDate.setDate(dueDate.getDate() + daysOffset);
      break;
    case 'custom':
      dueDate.setDate(dueDate.getDate() + (interval.value + daysOffset));
      break;
  }
  
  return dueDate;
}

// Helper to get or create a user
async function getOrCreateUser(email: string, password: string, displayName: string) {
  console.log(`\n📝 Processing user: ${email}`);
  
  try {
    // Try to sign in first
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✓ Signed in existing user: ${email}`);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      // User doesn't exist, create new one
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Create user profile in Firestore
        const now = Timestamp.now();
        await setDoc(doc(firestore, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName,
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        });
        
        console.log(`✓ Created new user: ${email}`);
        return userCredential.user;
      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          // Race condition: user was created between sign-in attempt and create
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          return userCredential.user;
        }
        throw createError;
      }
    }
    throw error;
  }
}

// Create a household
async function createHousehold(name: string, ownerId: string, memberIds: string[]) {
  console.log(`\n🏠 Creating household: ${name}`);
  
  const householdRef = doc(collection(firestore, 'households'));
  const now = Timestamp.now();
  
  const household = {
    id: householdRef.id,
    name,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(householdRef, household);
  console.log(`✓ Created household: ${name} (${householdRef.id})`);
  
  // Create memberships
  for (const userId of memberIds) {
    const memberId = `${householdRef.id}_${userId}`;
    const role = userId === ownerId ? 'admin' : 'member';
    
    await setDoc(doc(firestore, 'householdMembers', memberId), {
      id: memberId,
      householdId: householdRef.id,
      userId,
      role,
      joinedAt: now,
    });
  }
  
  console.log(`✓ Added ${memberIds.length} member(s) to ${name}`);
  
  return householdRef.id;
}

// Create chores for a household
async function createChores(
  householdId: string,
  householdName: string,
  userIds: string[],
  count: number
) {
  console.log(`\n🧹 Creating ${count} chores for ${householdName}`);
  
  const now = new Date();
  let overdueCount = 0;
  let todayCount = 0;
  let futureCount = 0;
  let oneOffCount = 0;
  let overriddenCount = 0;
  
  // Get current authenticated user to use as createdBy for all chores
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('No authenticated user for creating chores');
  }
  
  for (let i = 0; i < count; i++) {
    const choreRef = doc(collection(firestore, 'chores'));
    const timestamp = Timestamp.now();
    
    // Pick random chore attributes
    const interval = INTERVALS[i % INTERVALS.length];
    const isOneOff = interval.type === 'once';

    // Use one-off names for one-off intervals, regular names for others
    const name = isOneOff
      ? ONE_OFF_CHORE_NAMES[i % ONE_OFF_CHORE_NAMES.length]
      : CHORE_NAMES[i % CHORE_NAMES.length];
    const description = DESCRIPTIONS[i % DESCRIPTIONS.length] || undefined;
    // All chores created by the currently authenticated user
    const createdBy = currentUserId;
    
    // Assign some chores, leave some unassigned
    const assignedTo = i % 3 === 0 ? undefined : userIds[i % userIds.length];
    
    let dueAt: Timestamp | null;
    let isOverdueFlag: boolean;

    if (isOneOff) {
      // One-off chores: 50% have a due date, 50% have no deadline
      oneOffCount++;
      if (Math.random() < 0.5) {
        // One-off with a specific due date (future)
        const futureDays = Math.floor(Math.random() * 60) + 1;
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + futureDays);
        dueAt = Timestamp.fromDate(futureDate);
        isOverdueFlag = false;
        futureCount++;
      } else {
        // One-off with no deadline
        dueAt = null;
        isOverdueFlag = false;
      }
    } else {
      // Recurring chores — check if we should override the due date
      // ~15% of recurring chores get a manually overridden due date
      const shouldOverride = Math.random() < 0.15;

      if (shouldOverride) {
        // Overridden: set a custom future date that doesn't match the interval calculation
        overriddenCount++;
        const overrideDays = Math.floor(Math.random() * 90) + 7; // 7-96 days from now
        const overrideDate = new Date(now);
        overrideDate.setDate(overrideDate.getDate() + overrideDays);
        dueAt = Timestamp.fromDate(overrideDate);
        isOverdueFlag = false;
        futureCount++;
      } else {
        // Normal due date calculation with variety
        let daysOffset: number;
        const rand = Math.random();

        if (rand < 0.3) {
          daysOffset = -Math.floor(Math.random() * 14) - 1;
          overdueCount++;
        } else if (rand < 0.5) {
          daysOffset = 0;
          todayCount++;
        } else {
          daysOffset = Math.floor(Math.random() * 30) + 1;
          futureCount++;
        }

        const dueDate = calculateDueDate(interval, daysOffset);
        dueAt = Timestamp.fromDate(dueDate);
        isOverdueFlag = dueDate < now;
      }
    }
    
    // Build chore object, only including optional fields if they have values
    const chore: any = {
      id: choreRef.id,
      householdId,
      name,
      createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
      interval,
      dueAt,
      isOverdue: isOverdueFlag,
    };
    
    // Only add optional fields if they have values
    if (description) {
      chore.description = description;
    }
    if (assignedTo) {
      chore.assignedTo = assignedTo;
    }
    
    await setDoc(choreRef, chore);
  }
  
  console.log(`✓ Created ${count} chores:`);
  console.log(`  - ${overdueCount} overdue`);
  console.log(`  - ${todayCount} due today`);
  console.log(`  - ${futureCount} due in the future`);
  console.log(`  - ${oneOffCount} one-off (${oneOffCount > 0 ? 'some with no deadline' : ''})`);
  console.log(`  - ${overriddenCount} with overridden due dates`);
}

// Main seeding function
async function seed() {
  console.log('🌱 Starting seed script...\n');
  console.log(`Using Firebase project: ${firebaseConfig.projectId}\n`);
  
  try {
    // Step 1: Create or get test users
    console.log('━━━ Step 1: Creating/Getting Users ━━━');
    const userIds: string[] = [];
    for (const userData of TEST_USERS) {
      const user = await getOrCreateUser(
        userData.email,
        userData.password,
        userData.displayName
      );
      userIds.push(user.uid);
    }
    
    const [user1Id, user2Id, user3Id] = userIds;
    
    // Step 2: Create Personal households (one per user)
    // Sign in as each user to create their personal household
    console.log('\n━━━ Step 2: Creating Personal Households ━━━');
    
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    const personal1Id = await createHousehold('Personal', user1Id, [user1Id]);
    
    await signInWithEmailAndPassword(auth, TEST_USERS[1].email, TEST_USERS[1].password);
    const personal2Id = await createHousehold('Personal', user2Id, [user2Id]);
    
    await signInWithEmailAndPassword(auth, TEST_USERS[2].email, TEST_USERS[2].password);
    const personal3Id = await createHousehold('Personal', user3Id, [user3Id]);
    
    // Step 3: Create Family household (all 3 users) - sign in as user 1 (owner)
    console.log('\n━━━ Step 3: Creating Family Household ━━━');
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    const familyId = await createHousehold(
      'Family',
      user1Id,
      [user1Id, user2Id, user3Id]
    );
    
    // Step 4: Create Parents household (users 1 and 2) - sign in as user 1 (owner)
    console.log('\n━━━ Step 4: Creating Parents Household ━━━');
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    const parentsId = await createHousehold(
      'Parents',
      user1Id,
      [user1Id, user2Id]
    );
    
    // Step 5: Create chores for each household
    console.log('\n━━━ Step 5: Creating Chores ━━━');
    
    // Personal households: 20-25 chores each - sign in as the household owner
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    await createChores(personal1Id, 'Personal (User 1)', [user1Id], 20 + Math.floor(Math.random() * 6));
    
    await signInWithEmailAndPassword(auth, TEST_USERS[1].email, TEST_USERS[1].password);
    await createChores(personal2Id, 'Personal (User 2)', [user2Id], 20 + Math.floor(Math.random() * 6));
    
    await signInWithEmailAndPassword(auth, TEST_USERS[2].email, TEST_USERS[2].password);
    await createChores(personal3Id, 'Personal (User 3)', [user3Id], 20 + Math.floor(Math.random() * 6));
    
    // Family household: 25-30 chores - sign in as owner (user 1)
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    await createChores(
      familyId,
      'Family',
      [user1Id, user2Id, user3Id],
      25 + Math.floor(Math.random() * 6)
    );
    
    // Parents household: 25-30 chores - sign in as owner (user 1)
    await createChores(
      parentsId,
      'Parents',
      [user1Id, user2Id],
      25 + Math.floor(Math.random() * 6)
    );
    
    console.log('\n✅ Seed completed successfully!\n');
    console.log('━━━ Test Credentials ━━━');
    console.log('Email: test1@test.com, test2@test.com, test3@test.com');
    console.log('Password: Password1! (same for all)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed script
seed();
