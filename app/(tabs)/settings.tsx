/**
 * Settings Tab Screen
 * Notification settings and sign-out
 */

import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useNotificationSettings } from '@/lib/hooks/use-notification-settings';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useTheme } from '@/lib/contexts/theme-context';
import {
  cancelAllNotifications,
  requestPermissions,
  scheduleAllNotifications,
} from '@/lib/services/notification-service';
import { signOut } from '@/lib/services/auth-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTodayChores } from '@/lib/hooks/use-chores';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
];

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const accentColor = useThemeColor({}, 'badgeBackground');
  const accentTextColor = useThemeColor({}, 'badgeText');
  const textColor = useThemeColor({}, 'text');
  const dangerColor = useThemeColor({}, 'error');
  const buttonBackground = useThemeColor({}, 'buttonBackground');
  const iconColor = useThemeColor({}, 'icon');
  const { settings, updateSettings, loading } = useNotificationSettings();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { user } = useAuth();
  const { data: households = [] } = useUserHouseholds(user?.uid);
  const householdIds = useMemo(() => households.map((h) => h.id), [households]);
  const { data: chores = [] } = useTodayChores(user?.uid, householdIds);

  const resync = useCallback(
    async (newSettings: typeof settings) => {
      if (newSettings.enabled) {
        await scheduleAllNotifications(chores, newSettings);
      } else {
        await cancelAllNotifications();
      }
    },
    [chores]
  );

  const handleToggleEnabled = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Please enable notification permissions in your device settings.'
          );
          return;
        }
      }
      const next = await updateSettings({ enabled: value });
      await resync(next);
    },
    [updateSettings, resync]
  );

  const handleToggleDailyReminder = useCallback(
    async (value: boolean) => {
      const next = await updateSettings({ dailyReminderEnabled: value });
      await resync(next);
    },
    [updateSettings, resync]
  );

  const handleToggleChoreAlerts = useCallback(
    async (value: boolean) => {
      const next = await updateSettings({ choreAlertsEnabled: value });
      await resync(next);
    },
    [updateSettings, resync]
  );

  const handleTimeSelect = useCallback(
    async (time: string) => {
      setShowTimePicker(false);
      const next = await updateSettings({ dailyReminderTime: time });
      await resync(next);
    },
    [updateSettings, resync]
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <LoadingState />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.scrollContent}
    >
      <EmailVerificationBanner />
      <ThemedView style={styles.content}>
        {/* Appearance section */}
        <Typography variant="sectionTitle" style={styles.sectionTitle}>
          Appearance
        </Typography>
        <Card>
          <SettingRow
            label="Dark Mode"
            description={`Currently using ${theme === 'dark' ? 'dark' : 'light'} mode`}
            value={theme === 'dark'}
            onToggle={toggleTheme}
            accentColor={accentColor}
            inactiveTrackColor={buttonBackground}
            thumbColor={backgroundColor}
            inactiveThumbColor={iconColor}
          />
        </Card>

        <Typography variant="sectionTitle" style={styles.sectionTitle}>
          Notifications
        </Typography>

          {/* Master toggle */}
          <Card>
            <SettingRow
              label="Enable Notifications"
              description="Allow the app to send you notifications"
              value={settings.enabled}
              onToggle={handleToggleEnabled}
              accentColor={accentColor}
              inactiveTrackColor={buttonBackground}
              thumbColor={backgroundColor}
              inactiveThumbColor={iconColor}
            />
          </Card>

          {settings.enabled && (
            <>
              {/* Daily reminder section */}
              <Typography variant="sectionTitle" style={styles.sectionTitle}>
                Daily Reminder
              </Typography>
              <Card>
                <SettingRow
                  label="Daily Reminder"
                  description="Get a daily reminder to check your chores"
                  value={settings.dailyReminderEnabled}
                  onToggle={handleToggleDailyReminder}
                  accentColor={accentColor}
                  inactiveTrackColor={buttonBackground}
                  thumbColor={backgroundColor}
                  inactiveThumbColor={iconColor}
                />
                {settings.dailyReminderEnabled && (
                  <View style={[styles.timeRow, { borderTopColor: borderColor }]}>
                    <Typography>Reminder Time</Typography>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(!showTimePicker)}
                      style={[styles.timeBadge, { backgroundColor: accentColor }]}
                    >
                      <Typography style={{ color: accentTextColor, fontWeight: '600' }}>
                        {formatTime(settings.dailyReminderTime)}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>

              {showTimePicker && settings.dailyReminderEnabled && (
                <Card style={styles.timePickerCard}>
                  {TIME_OPTIONS.map((time) => {
                    const isSelected = time === settings.dailyReminderTime;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeOption,
                          isSelected && {
                            backgroundColor: accentColor + '22',
                          },
                        ]}
                        onPress={() => handleTimeSelect(time)}
                      >
                        <Typography
                          style={
                            isSelected
                              ? { color: accentColor, fontWeight: '600' }
                              : { color: textColor }
                          }
                        >
                          {formatTime(time)}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </Card>
              )}

              {/* Chore alerts section */}
              <Typography variant="sectionTitle" style={styles.sectionTitle}>
                Chore Alerts
              </Typography>
              <Card>
                <SettingRow
                  label="Due Date Alerts"
                  description="Get notified at 8:00 AM when a chore is due"
                  value={settings.choreAlertsEnabled}
                  onToggle={handleToggleChoreAlerts}
                  accentColor={accentColor}
                  inactiveTrackColor={buttonBackground}
                  thumbColor={backgroundColor}
                  inactiveThumbColor={iconColor}
                />
              </Card>
            </>
          )}

          {/* Sign Out */}
          <View style={styles.signOutSection}>
            <TouchableOpacity
              onPress={handleSignOut}
              style={[styles.signOutButton, { borderColor: dangerColor }]}
            >
              <Ionicons name="log-out-outline" size={20} color={dangerColor} />
              <Typography style={[styles.signOutText, { color: dangerColor }]}>
                Sign Out
              </Typography>
            </TouchableOpacity>
          </View>
        </ThemedView>
    </ScrollView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
  accentColor,
  inactiveTrackColor,
  thumbColor,
  inactiveThumbColor,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  accentColor: string;
  inactiveTrackColor: string;
  thumbColor: string;
  inactiveThumbColor: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Typography variant="bodySemiBold">{label}</Typography>
        <Typography variant="caption" muted>
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: inactiveTrackColor, true: accentColor }}
        thumbColor={value ? thumbColor : inactiveThumbColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  sectionTitle: { marginTop: 12, marginBottom: 8 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: { flex: 1, marginRight: 12 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timePickerCard: { marginTop: 6 },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  signOutSection: {
    marginTop: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
