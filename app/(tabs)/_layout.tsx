import { Tabs } from 'expo-router';
import React from 'react';

import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { usePendingInvites } from '@/lib/hooks/use-invites';

export default function TabLayout() {
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const { data: pendingInvites } = usePendingInvites(user?.email);
  const inviteCount = pendingInvites?.length ?? 0;

  return (
    <>
      <EmailVerificationBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintColor,
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
