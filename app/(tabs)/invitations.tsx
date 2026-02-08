/**
 * Invitations Screen
 * Shows pending household invitations for the current user
 */

import { InvitationCard } from '@/components/invitation-card';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAcceptInvite, useDeclineInvite, usePendingInvites } from '@/lib/hooks/use-invites';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InvitationsScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  const {
    data: invites = [],
    isLoading: loading,
    error,
    isRefetching,
    refetch,
  } = usePendingInvites(user?.email);

  const acceptMutation = useAcceptInvite(user?.email);
  const declineMutation = useDeclineInvite(user?.email);

  const handleRefresh = () => {
    refetch();
  };

  const handleAccept = async (inviteId: string) => {
    if (!user) return;

    // Check network connectivity (per PROJECT_CHARTER)
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

  const handleDecline = async (inviteId: string) => {
    // Check network connectivity (per PROJECT_CHARTER)
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={user?.emailVerified ? ['top'] : []}
    >
      {user?.emailVerified && <StatusBar style="auto" />}
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Typography variant="title">Invitations</Typography>
          <Typography muted style={styles.subtitle}>
            Household invitations sent to you
          </Typography>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !loading}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
        >
          {loading ? (
            <LoadingState message="Loading invitations..." />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Typography muted style={styles.errorText}>
                Error: {error.message}
              </Typography>
            </View>
          ) : invites.length === 0 ? (
            <EmptyState
              title="No pending invitations"
              message="When someone invites you to their household, you'll see it here."
            />
          ) : (
            <>
              {!isOnline && invites.length > 0 && (
                <Card variant="outlined" style={[styles.offlineWarning, { borderColor }]}>
                  <Typography variant="caption" style={styles.offlineText}>
                    ⚠️ You are offline. Connect to the internet to accept or decline invitations.
                  </Typography>
                </Card>
              )}
              <View style={styles.invitesList}>
                {invites.map((invite) => (
                  <InvitationCard
                    key={invite.id}
                    invite={invite}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </View>
            </>
          )}

          <Card variant="filled" style={styles.infoCard}>
            <Typography variant="bodySemiBold" style={styles.infoTitle}>
              About Invitations
            </Typography>
            <Typography muted style={styles.infoText}>
              • Invitations expire after 7 days
            </Typography>
            <Typography muted style={styles.infoText}>
              • You can accept or decline at any time
            </Typography>
            <Typography muted style={styles.infoText}>
              • Accepting adds you to the household
            </Typography>
          </Card>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  invitesList: {
    padding: 20,
  },
  infoCard: {
    margin: 20,
    padding: 20,
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    marginTop: 8,
  },
  offlineWarning: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  offlineText: {
    textAlign: 'center',
  },
});
