import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { InviteCountProvider, useInviteCount } from '@/lib/contexts/invite-count-context';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const { count: inviteCount, refreshCount } = useInviteCount();

  useEffect(() => {
    // Refresh invite count every 30 seconds
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Refresh invite count whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount])
  );

  return (
    <>
      <EmailVerificationBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Households',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="invitations"
          options={{
            title: 'Invitations',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
            tabBarBadge: inviteCount > 0 ? inviteCount : undefined,
          }}
        />
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <InviteCountProvider userEmail={user?.email || null}>
      <TabLayoutContent />
    </InviteCountProvider>
  );
}
