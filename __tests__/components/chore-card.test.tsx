import React from 'react';
import { render, fireEvent, screen } from '../helpers/test-utils';
import { ChoreCard } from '@/components/chore-card';
import { buildChore, buildOverdueChore, buildCompletedChore, daysFromNow } from '../helpers/factories';

describe('ChoreCard', () => {
  it('renders chore name', () => {
    const chore = buildChore({ name: 'Vacuum living room' });
    render(<ChoreCard chore={chore} />);
    expect(screen.getByText('Vacuum living room')).toBeTruthy();
  });

  it('shows "Today" for chore due today', () => {
    const now = new Date();
    const todayMidday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const chore = buildChore({
      dueAt: {
        toDate: () => todayMidday,
        toMillis: () => todayMidday.getTime(),
        seconds: Math.floor(todayMidday.getTime() / 1000),
        nanoseconds: 0,
      } as any,
    });
    render(<ChoreCard chore={chore} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('shows "No deadline" for chore with null dueAt', () => {
    const chore = buildChore({ dueAt: null });
    render(<ChoreCard chore={chore} />);
    expect(screen.getByText('No deadline')).toBeTruthy();
  });

  it('shows "Done" for completed chore', () => {
    const chore = buildCompletedChore();
    render(<ChoreCard chore={chore} />);
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('renders Overdue chip for overdue chore', () => {
    const chore = buildOverdueChore();
    render(<ChoreCard chore={chore} />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('does not show Overdue chip for completed chore even if past due', () => {
    const chore = buildCompletedChore({ dueAt: daysFromNow(-3), isOverdue: true });
    render(<ChoreCard chore={chore} />);
    expect(screen.queryByText('Overdue')).toBeNull();
  });

  it('renders assignee name when provided', () => {
    const chore = buildChore();
    render(<ChoreCard chore={chore} assigneeName="Alice" />);
    expect(screen.getByText(/Alice/)).toBeTruthy();
  });

  it('renders household name when provided', () => {
    const chore = buildChore();
    render(<ChoreCard chore={chore} householdName="Our House" />);
    expect(screen.getByText(/Our House/)).toBeTruthy();
  });

  it('renders room name when provided', () => {
    const chore = buildChore();
    render(<ChoreCard chore={chore} roomName="Kitchen" />);
    expect(screen.getByText(/Kitchen/)).toBeTruthy();
  });

  it('calls onUndo when checkmark is pressed on completed chore', () => {
    const onUndo = jest.fn();
    const chore = buildCompletedChore();
    render(<ChoreCard chore={chore} onUndo={onUndo} />);

    // Completed chores show a "✓" inside the checkbox Pressable
    fireEvent.press(screen.getByText('✓'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when chore name is tapped', () => {
    const onPress = jest.fn();
    const chore = buildChore({ name: 'Press me' });
    render(<ChoreCard chore={chore} onPress={onPress} />);

    // Pressing the chore name area triggers the Card's onPress
    fireEvent.press(screen.getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
