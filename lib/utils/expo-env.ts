/**
 * Expo environment detection utilities
 * Used to conditionally load native modules that aren't available in Expo Go.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Whether the app is running inside Expo Go (the store client).
 * Native modules from libraries like @react-native-google-signin/google-signin
 * and react-native-fbsdk-next are NOT available when this is true.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
