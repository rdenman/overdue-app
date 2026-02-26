import {
  calculateNextDueDate,
  isChoreOverdue,
  getUpcomingDueDates,
} from '@/lib/services/chore-service';
import type { Interval } from '@/lib/types/chore';
import { buildChore, daysFromNow, ts } from '../helpers/factories';

// ── calculateNextDueDate ──

describe('calculateNextDueDate', () => {
  const base = new Date('2025-06-15T12:00:00Z');

  it('advances by 1 day for daily interval', () => {
    const interval: Interval = { type: 'daily', value: 1 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getDate()).toBe(base.getDate() + 1);
    expect(result.getMonth()).toBe(base.getMonth());
  });

  it('advances by N days for daily interval with value > 1', () => {
    const interval: Interval = { type: 'daily', value: 3 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getDate()).toBe(base.getDate() + 3);
  });

  it('advances by 7 days for weekly interval', () => {
    const interval: Interval = { type: 'weekly', value: 1 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getDate()).toBe(base.getDate() + 7);
  });

  it('advances by 2 weeks for weekly interval with value 2', () => {
    const interval: Interval = { type: 'weekly', value: 2 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getDate()).toBe(base.getDate() + 14);
  });

  it('advances by 1 month for monthly interval', () => {
    const interval: Interval = { type: 'monthly', value: 1 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getMonth()).toBe(base.getMonth() + 1);
    expect(result.getDate()).toBe(base.getDate());
  });

  it('handles month rollover (e.g. November → January)', () => {
    const nov = new Date('2025-11-15T12:00:00Z');
    const interval: Interval = { type: 'monthly', value: 2 };
    const result = calculateNextDueDate(nov, interval);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2026);
  });

  it('advances by 1 year for yearly interval', () => {
    const interval: Interval = { type: 'yearly', value: 1 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getFullYear()).toBe(base.getFullYear() + 1);
    expect(result.getMonth()).toBe(base.getMonth());
    expect(result.getDate()).toBe(base.getDate());
  });

  it('treats custom interval as days', () => {
    const interval: Interval = { type: 'custom', value: 10 };
    const result = calculateNextDueDate(base, interval);
    expect(result.getDate()).toBe(base.getDate() + 10);
  });

  it('does not mutate the input date', () => {
    const original = new Date(base);
    const interval: Interval = { type: 'daily', value: 5 };
    calculateNextDueDate(base, interval);
    expect(base.getTime()).toBe(original.getTime());
  });
});

// ── isChoreOverdue ──

describe('isChoreOverdue', () => {
  it('returns false for chore with no dueAt', () => {
    const chore = buildChore({ dueAt: null });
    expect(isChoreOverdue(chore)).toBe(false);
  });

  it('returns true for chore past due with no completion', () => {
    const chore = buildChore({ dueAt: daysFromNow(-2), lastCompletion: undefined });
    expect(isChoreOverdue(chore)).toBe(true);
  });

  it('returns false for chore past due but completed', () => {
    const chore = buildChore({
      dueAt: daysFromNow(-2),
      lastCompletion: {
        completedAt: ts(),
        completedBy: 'user-1',
        previousDueAt: daysFromNow(-2),
      },
    });
    expect(isChoreOverdue(chore)).toBe(false);
  });

  it('returns false for chore due in the future', () => {
    const chore = buildChore({ dueAt: daysFromNow(3) });
    expect(isChoreOverdue(chore)).toBe(false);
  });
});

// ── getUpcomingDueDates ──

describe('getUpcomingDueDates', () => {
  const start = new Date('2025-01-01T12:00:00Z');

  it('returns the correct number of dates', () => {
    const interval: Interval = { type: 'weekly', value: 1 };
    const dates = getUpcomingDueDates(start, interval, 5);
    expect(dates).toHaveLength(5);
  });

  it('returns sequentially advancing dates for daily interval', () => {
    const interval: Interval = { type: 'daily', value: 1 };
    const dates = getUpcomingDueDates(start, interval, 3);

    expect(dates[0].getDate()).toBe(2); // Jan 2
    expect(dates[1].getDate()).toBe(3); // Jan 3
    expect(dates[2].getDate()).toBe(4); // Jan 4
  });

  it('returns sequentially advancing dates for weekly interval', () => {
    const interval: Interval = { type: 'weekly', value: 1 };
    const dates = getUpcomingDueDates(start, interval, 3);

    expect(dates[0].getDate()).toBe(8);  // Jan 8
    expect(dates[1].getDate()).toBe(15); // Jan 15
    expect(dates[2].getDate()).toBe(22); // Jan 22
  });

  it('returns empty array for count 0', () => {
    const interval: Interval = { type: 'daily', value: 1 };
    const dates = getUpcomingDueDates(start, interval, 0);
    expect(dates).toHaveLength(0);
  });

  it('each date is later than the previous one', () => {
    const interval: Interval = { type: 'monthly', value: 1 };
    const dates = getUpcomingDueDates(start, interval, 12);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });
});
