/**
 * Firebase configuration and singleton exports
 * React Native Firebase auto-initializes from GoogleService-Info.plist (iOS)
 * and google-services.json (Android) — no manual config needed.
 *
 * Firestore disk persistence is enabled by default on both platforms.
 */

// React Native Firebase v23's modular API internally still delegates to the
// namespaced API, triggering hundreds of deprecation warnings (known bug:
// https://github.com/invertase/react-native-firebase/issues/8334).
// This official flag must be set before any Firebase import.
declare const global: typeof globalThis & { RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS?: boolean };
global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export const auth = getAuth();
export const firestore = getFirestore();
