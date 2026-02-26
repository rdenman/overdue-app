import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('useNetworkStatus', () => {
  let listenerCallback: ((state: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    listenerCallback = null;

    mockNetInfo.addEventListener.mockImplementation((callback: any) => {
      listenerCallback = callback;
      return jest.fn(); // unsubscribe
    });

    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as any);
  });

  it('defaults to online state', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it('subscribes to NetInfo on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('fetches initial state on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(mockNetInfo.fetch).toHaveBeenCalledTimes(1);
  });

  it('updates when network state changes to offline', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Wait for the initial fetch to settle
    await waitFor(() => {
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    // Now simulate going offline via the listener
    await act(async () => {
      listenerCallback?.({
        isConnected: false,
        isInternetReachable: false,
      });
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('updates when network comes back online', async () => {
    // Start offline
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    // Wait for initial fetch to resolve as offline
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Come back online via listener
    await act(async () => {
      listenerCallback?.({
        isConnected: true,
        isInternetReachable: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('handles null values from NetInfo gracefully', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      listenerCallback?.({
        isConnected: null,
        isInternetReachable: null,
      });
    });

    // Defaults to true when null (per ?? true in the hook)
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
