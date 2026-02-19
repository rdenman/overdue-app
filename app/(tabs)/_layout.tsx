import { Tabs } from 'expo-router';
import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeColor } from '@/lib/hooks/use-theme-color';

export default function TabLayout() {
  const tintColor = useThemeColor({}, 'tint');
  const dangerColor = useThemeColor({}, 'error');
  const { user } = useAuth();
  const showVerificationBadge = user && !user.emailVerified;

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor={tintColor}>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house.fill" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Icon sf="person.2.fill" />
          <Label>Households</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Icon sf="gearshape.fill" />
          <Label>Settings</Label>
          <Badge hidden={!showVerificationBadge} />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarButton: HapticTab,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="(home)"
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
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="gearshape.fill" color={color} />
              {showVerificationBadge && (
                <View style={[styles.badge, { backgroundColor: dangerColor }]} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
