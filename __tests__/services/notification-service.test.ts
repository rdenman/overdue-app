import * as Notifications from 'expo-notifications';
import {
  scheduleDailyReminder,
  scheduleChoreNotification,
  scheduleAllNotifications,
  cancelAllNotifications,
  requestPermissions,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/lib/services/notification-service';
import { buildChore, buildCompletedChore, daysFromNow, ts } from '../helpers/factories';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestPermissions', () => {
  it('returns true when permissions are already granted', async () => {
    const result = await requestPermissions();
    expect(result).toBe(true);
  });

  it('calls getPermissionsAsync', async () => {
    await requestPermissions();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });
});

describe('cancelAllNotifications', () => {
  it('calls cancelAllScheduledNotificationsAsync', async () => {
    await cancelAllNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleDailyReminder', () => {
  it('schedules a daily notification at the given time', async () => {
    await scheduleDailyReminder('09:30');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('Daily Chore Reminder'),
        }),
        trigger: expect.objectContaining({
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 30,
        }),
      })
    );
  });

  it('parses hours and minutes correctly from HH:MM', async () => {
    await scheduleDailyReminder('14:05');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          hour: 14,
          minute: 5,
        }),
      })
    );
  });
});

describe('scheduleChoreNotification', () => {
  it('returns empty string for chore with no dueAt', async () => {
    const chore = buildChore({ dueAt: null });
    const result = await scheduleChoreNotification(chore);
    expect(result).toBe('');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules notification for chore due in the future', async () => {
    const chore = buildChore({ dueAt: daysFromNow(3), name: 'Vacuum' });
    await scheduleChoreNotification(chore);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '"Vacuum" is due today',
          data: { choreId: chore.id, householdId: chore.householdId },
        }),
      })
    );
  });
});

describe('scheduleAllNotifications', () => {
  it('cancels all existing notifications first', async () => {
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: false,
    };

    await scheduleAllNotifications([], settings);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing beyond cancel when notifications are disabled', async () => {
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: false,
    };

    await scheduleAllNotifications([buildChore()], settings);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules daily reminder when enabled', async () => {
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: true,
      dailyReminderEnabled: true,
      choreAlertsEnabled: false,
    };

    await scheduleAllNotifications([], settings);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('skips completed chores', async () => {
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: true,
      dailyReminderEnabled: false,
      choreAlertsEnabled: true,
    };

    const completed = buildCompletedChore({ dueAt: daysFromNow(2) });
    await scheduleAllNotifications([completed], settings);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('skips chores with no due date', async () => {
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: true,
      dailyReminderEnabled: false,
      choreAlertsEnabled: true,
    };

    const noDue = buildChore({ dueAt: null });
    await scheduleAllNotifications([noDue], settings);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
