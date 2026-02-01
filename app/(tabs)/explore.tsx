/**
 * Households Screen
 * Shows all households the user belongs to
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { getUserHouseholds } from '@/lib/services/household-service';
import { Household } from '@/lib/types/household';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HouseholdsScreen() {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const badgeBgColor = useThemeColor({}, 'badgeBackground');
  const badgeTextColor = useThemeColor({}, 'badgeText');
  const tintColor = useThemeColor({}, 'tint');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadHouseholds = async () => {
      try {
        setLoading(true);
        const userHouseholds = await getUserHouseholds(user.uid);
        setHouseholds(userHouseholds);
        setError(null);
      } catch (err: any) {
        console.error('Error loading households:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHouseholds();
  }, [user]);

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor }]} 
      edges={user?.emailVerified ? ['top'] : []}
    >
      {user?.emailVerified && <StatusBar style="auto" />}
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <ThemedText type="title">My Households</ThemedText>
          <ThemedText style={styles.subtitle}>
            View and manage your households
          </ThemedText>
        </View>

        <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>Loading households...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>Error: {error}</ThemedText>
          </View>
        ) : households.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle">No households yet</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              Household creation will be available in Phase 2.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.householdsList}>
            {households.map((household) => (
              <ThemedView 
                key={household.id} 
                style={styles.householdCard}
                lightColor={Colors.light.cardBackground}
                darkColor={Colors.dark.cardBackground}
              >
                <View style={styles.householdHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.householdName}>
                    {household.name}
                  </ThemedText>
                  <View style={[styles.ownerBadge, { backgroundColor: badgeBgColor }]}>
                    <ThemedText style={[styles.ownerText, { color: badgeTextColor }]}>
                      {household.ownerId === user?.uid ? 'Owner' : 'Member'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.householdDetail}>
                  Created: {household.createdAt.toDate().toLocaleDateString()}
                </ThemedText>
                <ThemedText style={styles.householdDetail}>
                  ID: {household.id}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        <ThemedView 
          style={styles.infoCard}
          lightColor={Colors.light.cardBackground}
          darkColor={Colors.dark.cardBackground}
        >
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            Coming in Phase 2
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Create additional households
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Invite other users to households
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Manage household settings
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
  householdsList: {
    padding: 20,
  },
  householdCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  ownerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  householdDetail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
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
});
