/**
 * Jest setup file
 * Module mocks for native/Expo modules and Firebase SDK that aren't
 * available in the test environment.
 */

import React from 'react';

// ── Firebase SDK mocks ──

// Lightweight Timestamp that mirrors the Firebase Timestamp API surface
// used throughout the app (fromDate, fromMillis, now, toDate, toMillis).
class MockTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }

  static now(): MockTimestamp {
    const ms = Date.now();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromDate(date: Date): MockTimestamp {
    const ms = date.getTime();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromMillis(ms: number): MockTimestamp {
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
}

jest.mock('firebase/firestore', () => ({
  Timestamp: MockTimestamp,
  collection: jest.fn(),
  doc: jest.fn().mockReturnValue({ withConverter: jest.fn().mockReturnThis() }),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn().mockReturnValue([{}]),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({}),
  initializeAuth: jest.fn().mockReturnValue({}),
  getReactNativePersistence: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  firestore: {},
  auth: {},
  app: {},
  functions: {},
  ENV: 'test',
}));

jest.mock('@/lib/firebase/converters', () => ({
  choreConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
  householdConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
  householdMemberConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
  roomConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
  userConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
  inviteConverter: { toFirestore: jest.fn(), fromFirestore: jest.fn() },
}));

// ── App context mocks ──

jest.mock('@/lib/contexts/theme-context', () => ({
  useTheme: jest.fn().mockReturnValue({ theme: 'light', toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/contexts/auth-context', () => ({
  useAuthContext: jest.fn().mockReturnValue({
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
}));

// ── Expo / React Native module mocks ──

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useSegments: jest.fn().mockReturnValue([]),
  useNavigation: jest.fn().mockReturnValue({
    setOptions: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  Redirect: 'Redirect',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn().mockReturnValue(jest.fn()),
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    }),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);
