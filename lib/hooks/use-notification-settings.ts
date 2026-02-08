/**
 * useNotificationSettings hook
 * AsyncStorage-backed notification preference management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
} from '../services/notification-service';

const STORAGE_KEY = '@notification_settings';

/**
 * Hook for reading and updating notification settings.
 * Settings are persisted to AsyncStorage and include sensible defaults.
 */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
        }
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Silently fail — settings will remain in memory
      }
      return next;
    },
    [settings]
  );

  return { settings, updateSettings, loading };
}
