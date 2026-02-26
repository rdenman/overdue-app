import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationSettings } from '@/lib/hooks/use-notification-settings';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/services/notification-service';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('useNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns default settings initially', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });

  it('starts in loading state and finishes loading', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    // Initial state is loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('loads saved settings from AsyncStorage', async () => {
    const savedSettings = { enabled: false, dailyReminderTime: '07:00' };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));

    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings.enabled).toBe(false);
    expect(result.current.settings.dailyReminderTime).toBe('07:00');
    // Defaults are merged in for fields not saved
    expect(result.current.settings.dailyReminderEnabled).toBe(true);
    expect(result.current.settings.choreAlertsEnabled).toBe(true);
  });

  it('updateSettings writes to AsyncStorage', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ enabled: false });
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@notification_settings',
      expect.stringContaining('"enabled":false')
    );
  });

  it('updateSettings merges with existing settings', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ dailyReminderTime: '08:00' });
    });

    expect(result.current.settings.dailyReminderTime).toBe('08:00');
    // Other fields unchanged
    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.dailyReminderEnabled).toBe(true);
  });

  it('uses defaults when AsyncStorage read fails', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });
});
