/**
 * Invitation Card Component
 * Displays a household invitation with accept/decline actions
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Typography } from '@/components/ui/typography';
import { InviteWithHouseholdInfo } from '@/lib/types/invite';
import React, { useState } from 'react';
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
    <Card variant="outlined">
      <View style={styles.header}>
        <Typography variant="bodySemiBold" style={styles.householdName}>
          {invite.householdName || 'Unknown Household'}
        </Typography>
        <Chip
          label={invite.role === 'admin' ? 'Admin' : 'Member'}
          selected
          size="sm"
        />
      </View>

      <View style={styles.details}>
        <Typography variant="caption" muted>
          From: {invite.inviterName || 'Unknown User'}
        </Typography>
        <Typography variant="caption" muted>
          Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
        </Typography>
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
    </Card>
  );
}

const styles = StyleSheet.create({
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
  details: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
