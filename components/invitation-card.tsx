/**
 * Invitation Card Component
 * Displays a household invitation with accept/decline actions
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { InviteWithHouseholdInfo } from '@/lib/types/invite';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

interface InvitationCardProps {
  invite: InviteWithHouseholdInfo;
  onAccept: (inviteId: string) => Promise<void>;
  onDecline: (inviteId: string) => Promise<void>;
}

export function InvitationCard({ invite, onAccept, onDecline }: InvitationCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const badgeBgColor = useThemeColor({}, 'badgeBackground');
  const badgeTextColor = useThemeColor({}, 'badgeText');
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await onAccept(invite.id);
    } catch {
      // Error handled by parent
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setDeclining(true);
      await onDecline(invite.id);
    } catch { 
      // Error handled by parent
    } finally {
      setDeclining(false);
    }
  };

  const isLoading = accepting || declining;
  const daysUntilExpiry = Math.ceil(
    (invite.expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <ThemedView
      style={[styles.card, { borderColor }]}
      lightColor={Colors.light.cardBackground}
      darkColor={Colors.dark.cardBackground}
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.householdName}>
          {invite.householdName || 'Unknown Household'}
        </ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: badgeBgColor }]}>
          <ThemedText style={[styles.roleText, { color: badgeTextColor }]}>
            {invite.role === 'admin' ? 'Admin' : 'Member'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <ThemedText style={styles.detailText}>
          From: {invite.inviterName || 'Unknown User'}
        </ThemedText>
        <ThemedText style={styles.detailText}>
          Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.button,
            styles.declineButton,
            { borderColor: errorColor },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDecline}
          disabled={isLoading}
        >
          {declining ? (
            <ActivityIndicator size="small" color={errorColor} />
          ) : (
            <ThemedText style={[styles.declineButtonText, { color: errorColor }]}>
              Decline
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.acceptButton,
            { backgroundColor: tintColor },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleAccept}
          disabled={isLoading}
        >
          {accepting ? (
            <ActivityIndicator size="small" color={buttonTextColor} />
          ) : (
            <Text style={[styles.acceptButtonText, { color: buttonTextColor }]}>Accept</Text>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  householdName: {
    fontSize: 18,
    flex: 1,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  declineButton: {
    borderWidth: 1,
  },
  declineButtonText: {
    fontWeight: '600',
  },
  acceptButton: {
    borderWidth: 0,
  },
  acceptButtonText: {
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
