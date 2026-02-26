import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useHouseholdChores, useChore, useTodayChores } from '@/lib/hooks/use-chores';
import { queryKeys } from '@/lib/hooks/query-keys';
import * as choreService from '@/lib/services/chore-service';
import { buildChore } from '../helpers/factories';

jest.mock('@/lib/services/chore-service');
jest.mock('@/lib/services/notification-service');

const mockChoreService = choreService as jest.Mocked<typeof choreService>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('useHouseholdChores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when householdId is undefined', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useHouseholdChores(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockChoreService.getHouseholdChores).not.toHaveBeenCalled();
  });

  it('fetches chores when householdId is provided', async () => {
    const chores = [buildChore(), buildChore()];
    mockChoreService.getHouseholdChores.mockResolvedValue(chores);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHouseholdChores('household-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(mockChoreService.getHouseholdChores).toHaveBeenCalledWith('household-1');
  });

  it('uses correct query key', () => {
    const key = queryKeys.chores.household('h1');
    expect(key).toEqual(['chores', 'household', 'h1']);
  });
});

describe('useChore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when choreId is undefined', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChore(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockChoreService.getChore).not.toHaveBeenCalled();
  });

  it('fetches a single chore when choreId is provided', async () => {
    const chore = buildChore({ id: 'chore-abc' });
    mockChoreService.getChore.mockResolvedValue(chore);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChore('chore-abc'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe('chore-abc');
    expect(mockChoreService.getChore).toHaveBeenCalledWith('chore-abc');
  });
});

describe('useTodayChores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when userId is undefined', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTodayChores(undefined, ['h1']), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockChoreService.getChoresForHouseholds).not.toHaveBeenCalled();
  });

  it('does not fetch when householdIds is empty', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTodayChores('user-1', []), { wrapper });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches chores across households', async () => {
    const chores = [buildChore(), buildChore(), buildChore()];
    mockChoreService.getChoresForHouseholds.mockResolvedValue(chores);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useTodayChores('user-1', ['h1', 'h2']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(3);
    expect(mockChoreService.getChoresForHouseholds).toHaveBeenCalledWith(['h1', 'h2']);
  });
});
