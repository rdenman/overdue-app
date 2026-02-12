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

// Chore name templates for variety, grouped by room
const CHORE_NAMES_BY_ROOM: Record<string, string[]> = {
  'Living Room': [
    'Vacuum living room',
    'Dust shelves',
    'Tidy living room',
    'Clean windows',
    'Organize bookshelf',
  ],
  'Kitchen': [
    'Wash dishes',
    'Wipe counters',
    'Empty dishwasher',
    'Clean fridge',
    'Clean oven',
    'Clean microwave',
    'Organize pantry',
    'Scrub sink',
    'Mop kitchen floor',
  ],
  'Bathroom': [
    'Clean bathroom',
    'Clean mirrors',
    'Scrub toilet',
    'Clean shower',
    'Refill toiletries',
  ],
  'Bedroom': [
    'Change bed sheets',
    'Vacuum bedroom',
    'Organize closet',
    'Dust bedroom',
  ],
  'Garage': [
    'Sweep garage',
    'Organize tools',
    'Take out recycling',
    'Sort storage bins',
  ],
  'Office': [
    'Organize desk',
    'Dust electronics',
    'File papers',
    'Vacuum office',
  ],
  'None': [
    'Take out trash',
    'Do laundry',
    'Water plants',
    'Sanitize doorknobs',
    'Replace air filters',
    'Check smoke detectors',
  ],
};

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

// One-off chore names (typically not room-specific)
const ONE_OFF_CHORE_NAMES = [
  'Replace front door',
  'Fix leaky faucet',
  'Paint bedroom',
  'Install new shelves',
  'Fix broken fence',
  'Replace smoke detector batteries',
];

// Room configurations
const DEFAULT_ROOMS = [
  { name: 'Living Room', sortOrder: 1, isDefault: true },
  { name: 'Kitchen', sortOrder: 2, isDefault: true },
  { name: 'Bathroom', sortOrder: 3, isDefault: true },
  { name: 'Bedroom', sortOrder: 4, isDefault: true },
];

const CUSTOM_ROOMS = [
  { name: 'Garage', sortOrder: 5, isDefault: false },
  { name: 'Office', sortOrder: 6, isDefault: false },
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

// Create rooms for a household
async function createRooms(householdId: string, includeCustom: boolean = false) {
  const now = Timestamp.now();
  const roomIds: Record<string, string> = {};
  
  // Create default rooms
  for (const room of DEFAULT_ROOMS) {
    const roomRef = doc(collection(firestore, 'households', householdId, 'rooms'));
    await setDoc(roomRef, {
      id: roomRef.id,
      householdId,
      name: room.name,
      isDefault: room.isDefault,
      sortOrder: room.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    roomIds[room.name] = roomRef.id;
  }
  
  // Optionally create custom rooms
  if (includeCustom) {
    for (const room of CUSTOM_ROOMS) {
      const roomRef = doc(collection(firestore, 'households', householdId, 'rooms'));
      await setDoc(roomRef, {
        id: roomRef.id,
        householdId,
        name: room.name,
        isDefault: room.isDefault,
        sortOrder: room.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
      roomIds[room.name] = roomRef.id;
    }
  }
  
  return roomIds;
}

// Create a household
async function createHousehold(name: string, ownerId: string, memberIds: string[], includeCustomRooms: boolean = false) {
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
  
  // Create rooms
  const roomIds = await createRooms(householdRef.id, includeCustomRooms);
  const roomCount = Object.keys(roomIds).length;
  console.log(`✓ Created ${roomCount} room(s) for ${name}`);
  
  return { householdId: householdRef.id, roomIds };
}

// Create chores for a household
async function createChores(
  householdId: string,
  householdName: string,
  userIds: string[],
  roomIds: Record<string, string>,
  count: number
) {
  console.log(`\n🧹 Creating ${count} chores for ${householdName}`);
  
  const now = new Date();
  let overdueCount = 0;
  let todayCount = 0;
  let futureCount = 0;
  let oneOffCount = 0;
  let overriddenCount = 0;
  let withRoomCount = 0;
  
  // Get current authenticated user to use as createdBy for all chores
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('No authenticated user for creating chores');
  }
  
  // Get all available room names for this household
  const availableRoomNames = Object.keys(roomIds);
  
  for (let i = 0; i < count; i++) {
    const choreRef = doc(collection(firestore, 'chores'));
    const timestamp = Timestamp.now();
    
    // Pick random chore attributes
    const interval = INTERVALS[i % INTERVALS.length];
    const isOneOff = interval.type === 'once';

    // Pick a room (80% chance of having a room, 20% no room)
    let roomName: string | null = null;
    let name: string;
    
    if (isOneOff) {
      // One-off chores usually don't have rooms
      name = ONE_OFF_CHORE_NAMES[i % ONE_OFF_CHORE_NAMES.length];
      roomName = null;
    } else {
      // For recurring chores, pick a room
      if (Math.random() < 0.8) {
        // 80% chance: pick a room from available rooms
        const filteredRoomNames = availableRoomNames.filter(name => name !== 'None');
        roomName = filteredRoomNames[i % filteredRoomNames.length];
      } else {
        // 20% chance: no room
        roomName = 'None';
      }
      
      // Pick a chore name appropriate for this room
      const choreList = CHORE_NAMES_BY_ROOM[roomName];
      name = choreList[i % choreList.length];
    }
    
    const description = DESCRIPTIONS[i % DESCRIPTIONS.length] || undefined;
    const createdBy = currentUserId;
    
    // Assign some chores, leave some unassigned
    const assignedTo = i % 3 === 0 ? undefined : userIds[i % userIds.length];
    
    // Get roomId (if room is assigned and not "None")
    const roomId = roomName && roomName !== 'None' ? roomIds[roomName] : undefined;
    if (roomId) withRoomCount++;
    
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
    if (roomId) {
      chore.roomId = roomId;
    }
    
    await setDoc(choreRef, chore);
  }
  
  console.log(`✓ Created ${count} chores:`);
  console.log(`  - ${overdueCount} overdue`);
  console.log(`  - ${todayCount} due today`);
  console.log(`  - ${futureCount} due in the future`);
  console.log(`  - ${oneOffCount} one-off (${oneOffCount > 0 ? 'some with no deadline' : ''})`);
  console.log(`  - ${overriddenCount} with overridden due dates`);
  console.log(`  - ${withRoomCount} assigned to rooms`);
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
    const personal1 = await createHousehold('Personal', user1Id, [user1Id], false);
    
    await signInWithEmailAndPassword(auth, TEST_USERS[1].email, TEST_USERS[1].password);
    const personal2 = await createHousehold('Personal', user2Id, [user2Id], false);
    
    await signInWithEmailAndPassword(auth, TEST_USERS[2].email, TEST_USERS[2].password);
    const personal3 = await createHousehold('Personal', user3Id, [user3Id], false);
    
    // Step 3: Create Family household (all 3 users) with custom rooms - sign in as user 1 (owner)
    console.log('\n━━━ Step 3: Creating Family Household ━━━');
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    const family = await createHousehold(
      'Family',
      user1Id,
      [user1Id, user2Id, user3Id],
      true // Include custom rooms
    );
    
    // Step 4: Create Parents household (users 1 and 2) with custom rooms - sign in as user 1 (owner)
    console.log('\n━━━ Step 4: Creating Parents Household ━━━');
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    const parents = await createHousehold(
      'Parents',
      user1Id,
      [user1Id, user2Id],
      true // Include custom rooms
    );
    
    // Step 5: Create chores for each household
    console.log('\n━━━ Step 5: Creating Chores ━━━');
    
    // Personal households: 20-25 chores each - sign in as the household owner
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    await createChores(
      personal1.householdId,
      'Personal (User 1)',
      [user1Id],
      personal1.roomIds,
      20 + Math.floor(Math.random() * 6)
    );
    
    await signInWithEmailAndPassword(auth, TEST_USERS[1].email, TEST_USERS[1].password);
    await createChores(
      personal2.householdId,
      'Personal (User 2)',
      [user2Id],
      personal2.roomIds,
      20 + Math.floor(Math.random() * 6)
    );
    
    await signInWithEmailAndPassword(auth, TEST_USERS[2].email, TEST_USERS[2].password);
    await createChores(
      personal3.householdId,
      'Personal (User 3)',
      [user3Id],
      personal3.roomIds,
      20 + Math.floor(Math.random() * 6)
    );
    
    // Family household: 25-30 chores - sign in as owner (user 1)
    await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
    await createChores(
      family.householdId,
      'Family',
      [user1Id, user2Id, user3Id],
      family.roomIds,
      25 + Math.floor(Math.random() * 6)
    );
    
    // Parents household: 25-30 chores - sign in as owner (user 1)
    await createChores(
      parents.householdId,
      'Parents',
      [user1Id, user2Id],
      parents.roomIds,
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
