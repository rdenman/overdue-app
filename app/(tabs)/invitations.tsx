/**
 * Invitations Screen
 * Shows pending household invitations for the current user
 */

import { InvitationCard } from '@/components/invitation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAcceptInvite, useDeclineInvite, usePendingInvites } from '@/lib/hooks/use-invites';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
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
          <ThemedText type="title">Invitations</ThemedText>
          <ThemedText style={styles.subtitle}>
            Household invitations sent to you
          </ThemedText>
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={styles.loadingText}>Loading invitations...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>Error: {error.message}</ThemedText>
            </View>
          ) : invites.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText type="subtitle">No pending invitations</ThemedText>
              <ThemedText style={styles.emptyMessage}>
                When someone invites you to their household, you&apos;ll see it here.
              </ThemedText>
            </View>
          ) : (
            <>
              {!isOnline && invites.length > 0 && (
                <ThemedView
                  style={[styles.offlineWarning, { borderColor }]}
                  lightColor={Colors.light.cardBackground}
                  darkColor={Colors.dark.cardBackground}
                >
                  <ThemedText style={styles.offlineText}>
                    ⚠️ You are offline. Connect to the internet to accept or decline invitations.
                  </ThemedText>
                </ThemedView>
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

          <ThemedView
            style={styles.infoCard}
            lightColor={Colors.light.cardBackground}
            darkColor={Colors.dark.cardBackground}
          >
            <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
              About Invitations
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Invitations expire after 7 days
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • You can accept or decline at any time
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Accepting adds you to the household
            </ThemedText>
          </ThemedView>
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
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  invitesList: {
    padding: 20,
  },
  infoCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    marginTop: 8,
    opacity: 0.8,
  },
  offlineWarning: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  offlineText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
  },
});
