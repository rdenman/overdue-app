/**
 * Household Settings Screen
 * Manage household name, members, and invitations
 */

import { HouseholdMemberList } from '@/components/household-member-list';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCurrentUserMembership,
  useDeleteHousehold,
  useHousehold,
  useHouseholdMembers,
  useRemoveHouseholdMember,
  useUpdateHousehold,
} from '@/lib/hooks/use-households';
import { useDeleteInvite, useHouseholdInvites } from '@/lib/hooks/use-invites';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export default function HouseholdSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');

  // ── Queries ──
  const { data: household, isLoading: loadingHousehold } = useHousehold(id);
  const { data: members = [], isLoading: loadingMembers } = useHouseholdMembers(id);
  const { data: currentUserMember, isLoading: loadingMember } = useCurrentUserMembership(id, user?.uid);
  const { data: allInvites = [], isLoading: loadingInvites } = useHouseholdInvites(id);

  const invites = useMemo(
    () => allInvites.filter((inv) => inv.status === 'pending'),
    [allInvites]
  );

  const loading = loadingHousehold || loadingMembers || loadingMember || loadingInvites;

  // ── Mutations ──
  const updateHouseholdMutation = useUpdateHousehold(id ?? '');
  const deleteHouseholdMutation = useDeleteHousehold();
  const removeMemberMutation = useRemoveHouseholdMember(id ?? '');
  const deleteInviteMutation = useDeleteInvite(id ?? '');

  // ── Local UI state ──
  const [editingName, setEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState('');

  const isAdmin = currentUserMember?.role === 'admin';
  const isOwner = household?.ownerId === user?.uid;

  const handleSaveName = async () => {
    if (!household || !id) return;

    const trimmedName = householdName.trim();
    if (!trimmedName || trimmedName === household.name) {
      setEditingName(false);
      setHouseholdName(household.name);
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      Alert.alert('Error', 'Household name must be between 3 and 50 characters');
      return;
    }

    try {
      await updateHouseholdMutation.mutateAsync({ name: trimmedName });
      setEditingName(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !user) return;

    try {
      await removeMemberMutation.mutateAsync({
        userId,
        requestingUserId: user.uid,
      });

      // If user removed themselves, go back
      if (userId === user.uid) {
        router.back();
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteHousehold = () => {
    if (!id || !user || !household) return;

    Alert.alert(
      'Delete Household',
      `Are you sure you want to delete "${household.name}"? This will remove all members, chores, and invitations. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHouseholdMutation.mutateAsync({
                householdId: id,
                userId: user.uid,
              });
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      await deleteInviteMutation.mutateAsync({ inviteId, userId: user.uid });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerBackTitle: 'Households',
          }}
        />
        <View style={[styles.container, { backgroundColor }]}>
          <LoadingState />
        </View>
      </>
    );
  }

  if (!household || !currentUserMember) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerBackTitle: 'Households',
          }}
        />
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.errorContainer}>
            <Typography color="error" style={styles.errorText}>
              Household not found or you don&apos;t have access
            </Typography>
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: household.name,
          headerBackTitle: 'Households',
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.content}>
          {/* Household Name Section */}
          <View style={styles.section}>
            <Typography variant="sectionTitle" style={styles.sectionTitle}>
              Household Name
            </Typography>
            {editingName ? (
              <View>
                <Input
                  value={householdName}
                  onChangeText={setHouseholdName}
                  autoFocus
                  maxLength={50}
                  editable={!updateHouseholdMutation.isPending}
                  containerStyle={styles.inputContainer}
                />
                <View style={styles.buttonRow}>
                  <Button
                    title="Cancel"
                    variant="outlined"
                    onPress={() => {
                      setEditingName(false);
                      setHouseholdName(household.name);
                    }}
                    disabled={updateHouseholdMutation.isPending}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save"
                    onPress={handleSaveName}
                    loading={updateHouseholdMutation.isPending}
                    disabled={updateHouseholdMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Typography variant="subtitle">{household.name}</Typography>
                {isAdmin && (
                  <Button
                    title="Edit"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setHouseholdName(household.name);
                      setEditingName(true);
                    }}
                  />
                )}
              </View>
            )}
          </View>

          {/* Members Section */}
          <HouseholdMemberList
            members={members}
            currentUserId={user?.uid || ''}
            isCurrentUserAdmin={isAdmin}
            householdOwnerId={household.ownerId}
            onRemoveMember={handleRemoveMember}
          />

          {/* Invitations Section */}
          {isAdmin && invites.length > 0 && (
            <View style={styles.section}>
              <Typography variant="sectionTitle" style={styles.sectionTitle}>
                Pending Invitations ({invites.length})
              </Typography>
              {invites.map((invite) => (
                <Card
                  key={invite.id}
                  variant="outlined"
                  style={styles.inviteCard}
                >
                  <View style={styles.inviteRow}>
                    <View style={styles.inviteInfo}>
                      <Typography variant="bodySemiBold">{invite.invitedEmail}</Typography>
                      <Typography variant="caption" muted style={styles.inviteDetail}>
                        Role: {invite.role === 'admin' ? 'Admin' : 'Member'}
                      </Typography>
                      <Typography variant="caption" muted style={styles.inviteDetail}>
                        Expires: {invite.expiresAt.toDate().toLocaleDateString()}
                      </Typography>
                    </View>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      onPress={() => handleDeleteInvite(invite.id)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Actions Section */}
          <View style={styles.section}>
            {isAdmin && (
              <Button
                title="Invite Member"
                size="lg"
                onPress={() => router.push(`/households/${id}/invite`)}
                style={{ marginBottom: 12 }}
              />
            )}

            {isOwner && (
              <Button
                title={deleteHouseholdMutation.isPending ? 'Deleting...' : 'Delete Household'}
                color="danger"
                size="lg"
                onPress={handleDeleteHousehold}
                loading={deleteHouseholdMutation.isPending}
                disabled={deleteHouseholdMutation.isPending}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteDetail: {
    marginTop: 2,
  },
});
