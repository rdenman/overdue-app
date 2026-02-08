/**
 * Household Member List Component
 * Displays and manages household members
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { HouseholdMember } from '@/lib/types/household';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';

interface HouseholdMemberListProps {
  members: HouseholdMember[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  householdOwnerId: string;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function HouseholdMemberList({
  members,
  currentUserId,
  isCurrentUserAdmin,
  householdOwnerId,
  onRemoveMember,
}: HouseholdMemberListProps) {
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const userIds = useMemo(() => members.map((m) => m.userId), [members]);
  const { profiles, isLoading: loading } = useUserProfiles(userIds);

  const membersWithUsers = useMemo(
    () =>
      members.map((member, index) => ({
        ...member,
        user: profiles[index] ?? undefined,
      })),
    [members, profiles]
  );

  const handleRemoveMember = (member: (typeof membersWithUsers)[number]) => {
    const isSelf = member.userId === currentUserId;
    const memberName = member.user?.displayName || member.userId;

    Alert.alert(
      isSelf ? 'Leave Household' : 'Remove Member',
      isSelf
        ? 'Are you sure you want to leave this household?'
        : `Are you sure you want to remove ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSelf ? 'Leave' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingUserId(member.userId);
              await onRemoveMember(member.userId);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setRemovingUserId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading members..." size="small" />;
  }

  return (
    <View style={styles.container}>
      <Typography variant="sectionTitle" style={styles.sectionTitle}>
        Members ({membersWithUsers.length})
      </Typography>

      {membersWithUsers.map((member) => {
        const isSelf = member.userId === currentUserId;
        const isOwner = member.userId === householdOwnerId;
        // Users can remove themselves (leave) OR admins can remove non-owner members
        const canRemove = isSelf || (isCurrentUserAdmin && !isOwner);

        return (
          <Card
            key={member.id}
            variant="outlined"
            style={styles.memberCard}
          >
            <View style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Typography variant="bodySemiBold" style={styles.memberName}>
                    {member.user?.displayName || 'Unknown User'}
                    {isSelf && <Typography muted style={styles.youLabel}> (You)</Typography>}
                  </Typography>
                  <Chip
                    label={member.role === 'admin' ? 'Admin' : 'Member'}
                    selected
                    size="sm"
                  />
                </View>
                <Typography variant="caption" muted style={styles.memberEmail}>
                  {member.user?.email}
                </Typography>
                <Typography variant="caption" muted>
                  Joined: {member.joinedAt.toDate().toLocaleDateString()}
                </Typography>
              </View>

              {canRemove && (
                <Button
                  title={isSelf ? 'Leave' : 'Remove'}
                  variant="ghost"
                  color="danger"
                  size="sm"
                  onPress={() => handleRemoveMember(member)}
                  loading={removingUserId === member.userId}
                  disabled={removingUserId === member.userId}
                />
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  memberCard: {
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberName: {
    fontSize: 16,
  },
  youLabel: {
    fontWeight: '400',
  },
  memberEmail: {
    marginBottom: 2,
  },
});
