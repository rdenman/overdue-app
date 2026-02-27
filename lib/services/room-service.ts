/**
 * Room service
 * Handles room CRUD operations for household organization
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
} from '@react-native-firebase/firestore';
import { firestore } from '../firebase/config';
import { roomConverter } from '../firebase/converters';
import {
  Room,
  RoomCreateInput,
  RoomUpdateInput,
} from '../types/room';
import { getHouseholdMember } from './membership-service';

const DEFAULT_ROOMS = [
  { name: 'Living Room', sortOrder: 1 },
  { name: 'Kitchen', sortOrder: 2 },
  { name: 'Bathroom', sortOrder: 3 },
  { name: 'Bedroom', sortOrder: 4 },
];

/**
 * Create a new room
 */
export async function createRoom(input: RoomCreateInput): Promise<Room> {
  try {
    const roomRef = doc(
      collection(firestore, 'households', input.householdId, 'rooms'),
    );

    const now = Timestamp.now();

    const room: Room = {
      id: roomRef.id,
      householdId: input.householdId,
      name: input.name,
      isDefault: input.isDefault ?? false,
      sortOrder: input.sortOrder ?? 999,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(roomRef, roomConverter.toFirestore(room));
    return room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
}

/**
 * Create default rooms for a new household
 */
export async function createDefaultRooms(householdId: string): Promise<Room[]> {
  try {
    const rooms: Room[] = [];

    for (const defaultRoom of DEFAULT_ROOMS) {
      const room = await createRoom({
        householdId,
        name: defaultRoom.name,
        isDefault: true,
        sortOrder: defaultRoom.sortOrder,
      });
      rooms.push(room);
    }

    return rooms;
  } catch (error) {
    console.error('Error creating default rooms:', error);
    throw new Error('Failed to create default rooms');
  }
}

/**
 * Get a single room by ID
 */
export async function getRoom(
  householdId: string,
  roomId: string
): Promise<Room | null> {
  try {
    const snap = await getDoc(
      doc(firestore, 'households', householdId, 'rooms', roomId),
    );

    return roomConverter.fromSnapshot(snap);
  } catch (error) {
    console.error('Error getting room:', error);
    throw new Error('Failed to load room');
  }
}

/**
 * Get all rooms for a household
 */
export async function getHouseholdRooms(householdId: string): Promise<Room[]> {
  try {
    const snap = await getDocs(
      collection(firestore, 'households', householdId, 'rooms'),
    );

    const rooms = snap.docs
      .map((d: any) => roomConverter.fromSnapshot(d))
      .filter((r: any): r is Room => r !== null);

    return rooms.sort((a: Room, b: Room) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error('Error getting household rooms:', error);
    throw new Error('Failed to load rooms');
  }
}

/**
 * Update a room
 */
export async function updateRoom(
  householdId: string,
  roomId: string,
  updates: RoomUpdateInput
): Promise<void> {
  try {
    await updateDoc(
      doc(firestore, 'households', householdId, 'rooms', roomId),
      {
        ...updates,
        updatedAt: Timestamp.now(),
      },
    );
  } catch (error) {
    console.error('Error updating room:', error);
    throw new Error('Failed to update room');
  }
}

/**
 * Delete a room and all associated chores
 * Only household admins can delete rooms
 */
export async function deleteRoom(
  householdId: string,
  roomId: string,
  requestingUserId: string
): Promise<void> {
  try {
    const member = await getHouseholdMember(householdId, requestingUserId);
    if (!member) {
      throw new Error('You are not a member of this household');
    }
    if (member.role !== 'admin') {
      throw new Error('Only admins can delete rooms');
    }

    const choresSnap = await getDocs(
      query(
        collection(firestore, 'chores'),
        where('householdId', '==', householdId),
        where('roomId', '==', roomId),
      ),
    );

    for (const choreDoc of choresSnap.docs) {
      await deleteDoc(choreDoc.ref);
    }

    await deleteDoc(
      doc(firestore, 'households', householdId, 'rooms', roomId),
    );
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}
