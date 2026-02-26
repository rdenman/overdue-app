/**
 * Test data factories
 * Create mock domain objects with sensible defaults that can be overridden.
 */

import { Timestamp } from 'firebase/firestore';
import type { Chore, Interval, Completion } from '@/lib/types/chore';
import type { Household, HouseholdMember } from '@/lib/types/household';
import type { HouseholdInvite } from '@/lib/types/invite';

// ── Timestamp helpers ──

export function ts(date: Date = new Date()): Timestamp {
  return Timestamp.fromDate(date);
}

export function daysFromNow(days: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Timestamp.fromDate(d);
}

// ── Chore factory ──

let choreCounter = 0;

export function buildChore(overrides: Partial<Chore> = {}): Chore {
  choreCounter++;
  const now = ts();
  return {
    id: `chore-${choreCounter}`,
    householdId: 'household-1',
    name: `Test Chore ${choreCounter}`,
    createdBy: 'user-1',
    createdAt: now,
    updatedAt: now,
    interval: { type: 'weekly', value: 1 },
    dueAt: daysFromNow(1),
    isOverdue: false,
    ...overrides,
  };
}

export function buildOverdueChore(overrides: Partial<Chore> = {}): Chore {
  return buildChore({
    dueAt: daysFromNow(-2),
    isOverdue: true,
    ...overrides,
  });
}

export function buildCompletedChore(overrides: Partial<Chore> = {}): Chore {
  return buildChore({
    lastCompletion: {
      completedAt: ts(),
      completedBy: 'user-1',
      previousDueAt: daysFromNow(-1),
    },
    ...overrides,
  });
}

export function buildInterval(overrides: Partial<Interval> = {}): Interval {
  return { type: 'weekly', value: 1, ...overrides };
}

// ── Household factory ──

let householdCounter = 0;

export function buildHousehold(overrides: Partial<Household> = {}): Household {
  householdCounter++;
  const now = ts();
  return {
    id: `household-${householdCounter}`,
    name: `Test Household ${householdCounter}`,
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ── HouseholdMember factory ──

export function buildHouseholdMember(
  overrides: Partial<HouseholdMember> = {}
): HouseholdMember {
  const householdId = overrides.householdId ?? 'household-1';
  const userId = overrides.userId ?? 'user-1';
  return {
    id: `${householdId}_${userId}`,
    householdId,
    userId,
    role: 'admin',
    joinedAt: ts(),
    ...overrides,
  };
}

// ── Invite factory ──

let inviteCounter = 0;

export function buildInvite(
  overrides: Partial<HouseholdInvite> = {}
): HouseholdInvite {
  inviteCounter++;
  const now = ts();
  return {
    id: `invite-${inviteCounter}`,
    householdId: 'household-1',
    householdName: 'Test Household',
    invitedBy: 'user-1',
    inviterName: 'Test User',
    invitedEmail: `invitee-${inviteCounter}@example.com`,
    role: 'member',
    status: 'pending',
    createdAt: now,
    expiresAt: daysFromNow(7),
    ...overrides,
  };
}
