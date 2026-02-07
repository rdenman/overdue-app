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
import { Button } from '@/components/ui/button';
import {
  StyleSheet,
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

  const borderColor = useThemeColor({}, 'border');
  const badgeBgColor = useThemeColor({}, 'badgeBackground');
  const badgeTextColor = useThemeColor({}, 'badgeText');

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
        <Button
          title="Decline"
          variant="outlined"
          color="danger"
          onPress={handleDecline}
          loading={declining}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <Button
          title="Accept"
          onPress={handleAccept}
          loading={accepting}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
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
});
