import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider, useAuthContext } from '@/lib/contexts/auth-context';
import { SyncProvider } from '@/lib/contexts/sync-context';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/lib/contexts/theme-context';
import { queryClient } from '@/lib/query-client';
import {
    configureNotificationHandler,
    requestPermissions,
} from '@/lib/services/notification-service';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

// Configure notification handler once at module level
configureNotificationHandler();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { theme } = useTheme();
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  const permissionsRequested = useRef(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }

    // Request notification permissions once when user first authenticates
    if (user && !permissionsRequested.current) {
      permissionsRequested.current = true;
      requestPermissions();
    }
  }, [router, user, loading, segments]);

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <RootLayoutNav />
            </SyncProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
