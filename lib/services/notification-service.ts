/**
 * Notification Service
 * Local notification scheduling for daily reminders and chore due date alerts.
 * Uses expo-notifications for all scheduling (no FCM required for v1).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Chore } from '../types/chore';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "HH:MM" format
  choreAlertsEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminderEnabled: true,
  dailyReminderTime: '09:00',
  choreAlertsEnabled: true,
};

/** Maximum number of days in the future to schedule chore notifications. */
const SCHEDULE_HORIZON_DAYS = 14;

/** Hour at which per-chore due date alerts fire (8:00 AM). */
const CHORE_ALERT_HOUR = 8;

// ── Permission Handling ──

/**
 * Request notification permissions from the OS.
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Notification Handler (so notifications show while app is in foreground) ──

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ── Scheduling ──

/**
 * Master re-sync: cancel all pending notifications, then re-schedule
 * based on current chore data and user settings.
 */
export async function scheduleAllNotifications(
  chores: Chore[],
  settings: NotificationSettings
): Promise<void> {
  await cancelAllNotifications();

  if (!settings.enabled) return;

  const promises: Promise<string>[] = [];

  if (settings.dailyReminderEnabled) {
    promises.push(scheduleDailyReminder(settings.dailyReminderTime));
  }

  if (settings.choreAlertsEnabled) {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + SCHEDULE_HORIZON_DAYS);

    for (const chore of chores) {
      // Skip completed chores and chores with no due date
      if (chore.lastCompletion) continue;
      if (!chore.dueAt) continue;

      const dueDate = chore.dueAt.toDate();
      // Only schedule if due date is in the future and within horizon
      if (dueDate > now && dueDate <= horizon) {
        promises.push(scheduleChoreNotification(chore));
      }
    }
  }

  await Promise.all(promises);
}

/**
 * Schedule a repeating daily reminder at the user-chosen time.
 */
export async function scheduleDailyReminder(time: string): Promise<string> {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '🏠 Daily Chore Reminder',
      body: 'Check your chores for today!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    },
  });
}

/**
 * Schedule a one-time notification for a chore at 8:00 AM on its due date.
 */
export async function scheduleChoreNotification(chore: Chore): Promise<string> {
  if (!chore.dueAt) return '';
  const dueDate = chore.dueAt.toDate();
  const triggerDate = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
    CHORE_ALERT_HOUR,
    0,
    0
  );

  // If the trigger time has already passed today, skip
  if (triggerDate <= new Date()) {
    return '';
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '📋 Chore Due Today',
      body: `"${chore.name}" is due today`,
      sound: 'default',
      data: { choreId: chore.id, householdId: chore.householdId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    },
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
