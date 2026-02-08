/**
 * Households Screen
 * Shows all households the user belongs to
 */

import { CreateHouseholdModal } from '@/components/create-household-modal';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HouseholdsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: households = [],
    isLoading: loading,
    error,
  } = useUserHouseholds(user?.uid);

  const handleHouseholdPress = (householdId: string) => {
    router.push(`/households/${householdId}/chores`);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={user?.emailVerified ? ['top'] : []}
    >
      {user?.emailVerified && <StatusBar style="auto" />}
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View style={styles.headerContent}>
            <View>
              <Typography variant="title">My Households</Typography>
              <Typography muted style={styles.subtitle}>
                View and manage your households
              </Typography>
            </View>
            <Button
              title="+ New"
              size="sm"
              onPress={() => setShowCreateModal(true)}
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
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
                  <Typography variant="caption" muted style={styles.householdDetail}>
                    Created: {household.createdAt.toDate().toLocaleDateString()}
                  </Typography>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
