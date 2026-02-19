/**
 * Households Screen
 * Shows all households the user belongs to, with pending invites at the top
 */

import { CreateHouseholdModal } from '@/components/create-household-modal';
import { InvitationCard } from '@/components/invitation-card';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAllHouseholdChoreStats } from '@/lib/hooks/use-chores';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useAcceptInvite, useDeclineInvite, usePendingInvites } from '@/lib/hooks/use-invites';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export default function HouseholdsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isOnline } = useNetworkStatus();

  const {
    data: households = [],
    isLoading: loading,
    error,
  } = useUserHouseholds(user?.uid);

  const { data: pendingInvites = [] } = usePendingInvites(user?.email);
  const acceptMutation = useAcceptInvite(user?.email);
  const declineMutation = useDeclineInvite(user?.email);

  const householdIds = useMemo(() => households.map((h) => h.id), [households]);
  const { statsMap } = useAllHouseholdChoreStats(user?.uid, householdIds);

  // Configure header with add button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          hitSlop={8}
        >
          <IconSymbol name="plus" size={22} color={tintColor} />
        </Pressable>
      ),
    });
  }, [navigation, tintColor]);

  const handleHouseholdPress = (householdId: string) => {
    router.push(`/households/${householdId}/chores`);
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!user) return;
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'You must be online to accept invitations. Please check your connection and try again.'
      );
      return;
    }
    try {
      await acceptMutation.mutateAsync({ inviteId, userId: user.uid });
      Alert.alert('Success', 'You have joined the household!');
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      Alert.alert('Error', err.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'You must be online to decline invitations. Please check your connection and try again.'
      );
      return;
    }
    try {
      await declineMutation.mutateAsync(inviteId);
      Alert.alert('Declined', 'You have declined the invitation');
    } catch (err: any) {
      console.error('Error declining invite:', err);
      Alert.alert('Error', err.message || 'Failed to decline invitation');
    }
  };

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ScrollView style={styles.content}>
          {/* Pending Invitations Section */}
          {pendingInvites.length > 0 && (
            <View style={styles.invitesSection}>
              <Typography variant="sectionTitle" style={styles.invitesSectionTitle}>
                Pending Invitations ({pendingInvites.length})
              </Typography>
              {pendingInvites.map((invite) => (
                <InvitationCard
                  key={invite.id}
                  invite={invite}
                  onAccept={handleAcceptInvite}
                  onDecline={handleDeclineInvite}
                />
              ))}
            </View>
          )}

          {loading ? (
            <LoadingState message="Loading households..." />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Typography color="error" style={styles.errorText}>
                Error: {error.message}
              </Typography>
            </View>
          ) : households.length === 0 ? (
            <EmptyState
              title="No households yet"
              message="Create a household to start tracking chores."
            />
          ) : (
            <View style={styles.householdsList}>
              {households.map((household) => (
                <Card
                  key={household.id}
                  onPress={() => handleHouseholdPress(household.id)}
                >
                  <View style={styles.householdHeader}>
                    <Typography variant="bodySemiBold" style={styles.householdName}>
                      {household.name}
                    </Typography>
                    <Chip
                      label={household.ownerId === user?.uid ? 'Owner' : 'Member'}
                      selected
                      size="sm"
                    />
                  </View>
                  {/* Chore stats */}
                  {statsMap[household.id] && (
                    <View style={styles.statsRow}>
                      {statsMap[household.id].overdue > 0 && (
                        <Chip
                          label={`${statsMap[household.id].overdue} overdue`}
                          selected
                          color="danger"
                          size="sm"
                        />
                      )}
                      {statsMap[household.id].dueToday > 0 && (
                        <Chip
                          label={`${statsMap[household.id].dueToday} due today`}
                          selected
                          color="primary"
                          size="sm"
                        />
                      )}
                      {statsMap[household.id].total > 0 &&
                        statsMap[household.id].overdue === 0 &&
                        statsMap[household.id].dueToday === 0 && (
                          <Typography variant="caption" muted>
                            {statsMap[household.id].total} chore{statsMap[household.id].total !== 1 ? 's' : ''}
                          </Typography>
                        )}
                    </View>
                  )}
                  <Typography variant="caption" muted style={styles.householdDetail}>
                    Tap to view chores
                  </Typography>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </ThemedView>

      <CreateHouseholdModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={user?.uid || ''}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  invitesSection: {
    padding: 20,
    paddingBottom: 0,
  },
  invitesSectionTitle: {
    marginBottom: 12,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  householdsList: {
    padding: 20,
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  householdName: {
    fontSize: 18,
  },
  householdDetail: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
  },
});
