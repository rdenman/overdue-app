/**
 * Firebase configuration and initialization
 * Provides singleton exports for Firebase services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Get environment from Expo constants or default to development
const ENV = Constants.expoConfig?.extra?.env || 'development';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing. Please check your app.config.js');
  throw new Error('Firebase configuration is incomplete');
}

// Initialize Firebase app (only once)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with React Native persistence
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If already initialized, just get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore with memory cache
// Note: Persistent offline cache requires native modules (@react-native-firebase)
// Memory cache provides offline access during app session only (data cleared on restart)
let firestore: Firestore;
try {
  // Default memory cache - works in Expo Go, no native modules required
  firestore = initializeFirestore(app, {});
} catch (error) {
  // If already initialized, just get the existing instance
  firestore = getFirestore(app);
}

// Initialize Functions
const functions = getFunctions(app);

// Log initialization in development
if (__DEV__) {
  console.log(`Firebase initialized for ${ENV} environment`);
  console.log(`Project ID: ${firebaseConfig.projectId}`);
}

// Export singleton instances
export { app, auth, ENV, firestore, functions };

