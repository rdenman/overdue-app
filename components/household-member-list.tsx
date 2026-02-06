/**
 * Household Member List Component
 * Displays and manages household members
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useUserProfiles } from '@/lib/hooks/use-users';
import { HouseholdMember } from '@/lib/types/household';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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

  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const badgeBgColor = useThemeColor({}, 'badgeBackground');
  const badgeTextColor = useThemeColor({}, 'badgeText');

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <ThemedText style={styles.loadingText}>Loading members...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
        Members ({membersWithUsers.length})
      </ThemedText>

      {membersWithUsers.map((member) => {
        const isSelf = member.userId === currentUserId;
        const isOwner = member.userId === householdOwnerId;
        // Users can remove themselves (leave) OR admins can remove non-owner members
        const canRemove = isSelf || (isCurrentUserAdmin && !isOwner);

        return (
          <ThemedView
            key={member.id}
            style={[styles.memberCard, { borderColor }]}
            lightColor={Colors.light.cardBackground}
            darkColor={Colors.dark.cardBackground}
          >
            <View style={styles.memberInfo}>
              <View style={styles.memberHeader}>
                <ThemedText type="defaultSemiBold" style={styles.memberName}>
                  {member.user?.displayName || 'Unknown User'}
                  {isSelf && <ThemedText style={styles.youLabel}> (You)</ThemedText>}
                </ThemedText>
                <View style={[styles.roleBadge, { backgroundColor: badgeBgColor }]}>
                  <ThemedText style={[styles.roleText, { color: badgeTextColor }]}>
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.memberEmail}>{member.user?.email}</ThemedText>
              <ThemedText style={styles.memberDetail}>
                Joined: {member.joinedAt.toDate().toLocaleDateString()}
              </ThemedText>
            </View>

            {canRemove && (
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member)}
                disabled={removingUserId === member.userId}
              >
                {removingUserId === member.userId ? (
                  <ActivityIndicator size="small" color={errorColor} />
                ) : (
                  <ThemedText style={[styles.removeButtonText, { color: errorColor }]}>
                    {isSelf ? 'Leave' : 'Remove'}
                  </ThemedText>
                )}
              </Pressable>
            )}
          </ThemedView>
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
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
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
    opacity: 0.7,
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 2,
  },
  memberDetail: {
    fontSize: 12,
    opacity: 0.6,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
