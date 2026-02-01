/**
 * Today's Chores Screen
 * Shows chores due today (empty state for Phase 1)
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { signOut } from '@/lib/services/auth-service';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const buttonBgColor = useThemeColor({}, 'buttonBackground');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
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
          <View>
            <ThemedText type="title">Today&apos;s Chores</ThemedText>
            <ThemedText style={styles.greeting}>
              Hello, {user?.displayName || 'there'}!
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: buttonBgColor }]} 
            onPress={handleSignOut}
          >
            <Text style={[styles.signOutText, { color: buttonTextColor }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No chores yet
            </ThemedText>
            <ThemedText style={styles.emptyMessage}>
              Chore creation will be available in the next phase.
            </ThemedText>
            <ThemedText style={styles.emptyMessage}>
              For now, you can explore your households in the Explore tab.
            </ThemedText>
          </View>

          <ThemedView 
            style={styles.infoCard}
            lightColor={Colors.light.cardBackground}
            darkColor={Colors.dark.cardBackground}
          >
            <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
              Phase 1 Complete ✓
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Authentication working
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • User profile created
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Default &quot;Personal&quot; household created
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Email verification enabled
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
  },
  greeting: {
    marginTop: 4,
    opacity: 0.7,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
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
