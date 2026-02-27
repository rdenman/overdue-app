/**
 * Chore service
 * Handles chore CRUD, completion, undo, and due-date calculation
 */

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { firestore } from '../firebase/config';
import { choreConverter } from '../firebase/converters';
import {
  Chore,
  ChoreCreateInput,
  ChoreUpdateInput,
  Interval,
} from '../types/chore';

// ── Due-date helpers ──

/**
 * Calculate the next due date from a base date and an interval.
 */
export function calculateNextDueDate(from: Date, interval: Interval): Date {
  const next = new Date(from);

  switch (interval.type) {
    case 'daily':
      next.setDate(next.getDate() + interval.value);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval.value);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval.value);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval.value);
      break;
    case 'custom':
      next.setDate(next.getDate() + interval.value);
      break;
  }

  return next;
}

/**
 * Determine whether a chore is overdue right now.
 * Chores with no due date (null) are never overdue.
 */
export function isChoreOverdue(chore: Chore): boolean {
  if (!chore.dueAt) return false;
  return chore.dueAt.toDate() < new Date() && !chore.lastCompletion;
}

/**
 * Compute the next N upcoming due dates starting from a given date and interval.
 */
export function getUpcomingDueDates(
  fromDate: Date,
  interval: Interval,
  count: number
): Date[] {
  const dates: Date[] = [];
  let current = fromDate;
  for (let i = 0; i < count; i++) {
    const next = calculateNextDueDate(current, interval);
    dates.push(next);
    current = next;
  }
  return dates;
}

// ── CRUD ──

export async function createChore(input: ChoreCreateInput): Promise<Chore> {
  try {
    const choreRef = doc(collection(firestore, 'chores'));
    const now = Timestamp.now();

    let dueAt: Timestamp | null;
    if (input.dueAt !== undefined) {
      dueAt = input.dueAt;
    } else if (input.interval.type === 'once') {
      dueAt = null;
    } else {
      dueAt = Timestamp.fromDate(
        calculateNextDueDate(now.toDate(), input.interval)
      );
    }

    const chore: Chore = {
      id: choreRef.id,
      householdId: input.householdId,
      name: input.name,
      description: input.description,
      assignedTo: input.assignedTo,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      interval: input.interval,
      dueAt,
      isOverdue: false,
    };

    await setDoc(choreRef, choreConverter.toFirestore(chore));

    return chore;
  } catch (error) {
    console.error('Error creating chore:', error);
    throw new Error('Failed to create chore');
  }
}

export async function getChore(choreId: string): Promise<Chore | null> {
  try {
    const snap = await getDoc(doc(firestore, 'chores', choreId));
    return choreConverter.fromSnapshot(snap);
  } catch (error) {
    console.error('Error getting chore:', error);
    throw new Error('Failed to load chore');
  }
}

export async function getHouseholdChores(
  householdId: string
): Promise<Chore[]> {
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'chores'),
        where('householdId', '==', householdId),
        orderBy('dueAt', 'asc'),
      ),
    );

    return snap.docs
      .map((d: any) => choreConverter.fromSnapshot(d))
      .filter((c: any): c is Chore => c !== null);
  } catch (error) {
    console.error('Error getting household chores:', error);
    throw new Error('Failed to load chores');
  }
}

export async function getChoresForHouseholds(
  householdIds: string[]
): Promise<Chore[]> {
  if (householdIds.length === 0) return [];

  try {
    const batches: Chore[] = [];
    for (let i = 0; i < householdIds.length; i += 30) {
      const batch = householdIds.slice(i, i + 30);
      const snap = await getDocs(
        query(
          collection(firestore, 'chores'),
          where('householdId', 'in', batch),
          orderBy('dueAt', 'asc'),
        ),
      );

      const chores = snap.docs
        .map((d: any) => choreConverter.fromSnapshot(d))
        .filter((c: any): c is Chore => c !== null);
      batches.push(...chores);
    }

    batches.sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.toMillis() - b.dueAt.toMillis();
    });
    return batches;
  } catch (error) {
    console.error('Error getting chores for households:', error);
    throw new Error('Failed to load chores');
  }
}

export async function updateChore(
  choreId: string,
  updates: ChoreUpdateInput
): Promise<void> {
  try {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      sanitized[key] = value === undefined ? deleteField() : value;
    }

    await updateDoc(doc(firestore, 'chores', choreId), {
      ...sanitized,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating chore:', error);
    throw new Error('Failed to update chore');
  }
}

export async function deleteChore(choreId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'chores', choreId));
  } catch (error) {
    console.error('Error deleting chore:', error);
    throw new Error('Failed to delete chore');
  }
}

// ── Completion ──

export async function completeChore(
  choreId: string,
  userId: string
): Promise<void> {
  try {
    const chore = await getChore(choreId);
    if (!chore) throw new Error('Chore not found');

    const isOneOff = chore.interval.type === 'once';
    const choreRef = doc(firestore, 'chores', choreId);

    if (isOneOff) {
      await updateDoc(choreRef, {
        lastCompletion: {
          completedAt: Timestamp.now(),
          completedBy: userId,
          previousDueAt: chore.dueAt,
        },
        isOverdue: false,
        updatedAt: Timestamp.now(),
      });
    } else {
      const now = new Date();
      const dueDate = chore.dueAt!.toDate();
      const baseDate = now > dueDate ? now : dueDate;
      const nextDue = calculateNextDueDate(baseDate, chore.interval);

      await updateDoc(choreRef, {
        lastCompletion: {
          completedAt: Timestamp.now(),
          completedBy: userId,
          previousDueAt: chore.dueAt,
        },
        dueAt: Timestamp.fromDate(nextDue),
        isOverdue: false,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error completing chore:', error);
    throw error;
  }
}

export async function undoCompletion(choreId: string): Promise<void> {
  try {
    const chore = await getChore(choreId);
    if (!chore) throw new Error('Chore not found');
    if (!chore.lastCompletion) throw new Error('No completion to undo');

    const restoredDueAt = chore.lastCompletion.previousDueAt;
    const nowOverdue = restoredDueAt
      ? restoredDueAt.toDate() < new Date()
      : false;

    await updateDoc(doc(firestore, 'chores', choreId), {
      lastCompletion: null,
      dueAt: restoredDueAt,
      isOverdue: nowOverdue,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error undoing completion:', error);
    throw error;
  }
}
