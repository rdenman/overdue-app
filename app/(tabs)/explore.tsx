/**
 * Households Screen
 * Shows all households the user belongs to
 */

import { CreateHouseholdModal } from '@/components/create-household-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserHouseholds } from '@/lib/hooks/use-households';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HouseholdsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const badgeBgColor = useThemeColor({}, 'badgeBackground');
  const badgeTextColor = useThemeColor({}, 'badgeText');
  const tintColor = useThemeColor({}, 'tint');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: households = [],
    isLoading: loading,
    error,
  } = useUserHouseholds(user?.uid);

  // Button text color: dark text on light tint (dark mode), white text on dark tint (light mode)
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const handleHouseholdPress = (householdId: string) => {
    router.push(`/households/${householdId}/settings`);
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
              <ThemedText type="title">My Households</ThemedText>
              <ThemedText style={styles.subtitle}>
                View and manage your households
              </ThemedText>
            </View>
            <Pressable
              style={[styles.createButton, { backgroundColor: tintColor }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={[styles.createButtonText, { color: buttonTextColor }]}>+ New</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>Loading households...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>Error: {error.message}</ThemedText>
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
              <Pressable
                key={household.id}
                onPress={() => handleHouseholdPress(household.id)}
              >
                <ThemedView 
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
                    Tap to view settings
                  </ThemedText>
                </ThemedView>
              </Pressable>
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
    opacity: 0.7,
  },
  createButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    fontWeight: '600',
    fontSize: 14,
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
});
