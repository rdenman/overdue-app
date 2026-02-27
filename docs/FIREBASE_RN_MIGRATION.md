# Firebase SDK Migration: Web SDK → React Native Firebase

## What Changed

The app migrated from the **Firebase Web SDK** (`firebase` v12, modular API) to **React Native Firebase** (`@react-native-firebase/*` v23) for Auth and Firestore.

### Why

The Web SDK's Firestore only supports an **in-memory cache** in React Native — all cached data is lost when the app restarts. React Native Firebase uses the native iOS/Android Firestore SDKs, which provide **SQLite-backed disk persistence enabled by default**. This makes the offline experience significantly more robust: previously-fetched data survives app restarts, and writes made offline are automatically synced when connectivity returns.

### Packages

| Package | Before | After |
|---|---|---|
| `firebase` | production dependency | **devDependency** (still used by `scripts/seed.ts` and `scripts/cleanup.ts`) |
| `@react-native-firebase/app` | — | production dependency |
| `@react-native-firebase/auth` | — | production dependency |
| `@react-native-firebase/firestore` | — | production dependency |

### What Did NOT Change

- **Firebase Console configuration** — no changes needed
- **Firestore security rules** — unchanged
- **Firestore indexes** — unchanged
- **Auth providers** — same providers (Email/Password, Apple, Google, Facebook)
- **Social sign-in SDKs** — `@react-native-google-signin/google-signin`, `react-native-fbsdk-next`, `expo-apple-authentication` remain the same
- **Cloud Functions** — not actively used, removed from initialization
- **Scripts** — `scripts/seed.ts` and `scripts/cleanup.ts` still use the Web SDK (they run in Node.js via `tsx`, not in React Native)

## Firebase Console Verification Checklist

No console changes are strictly required, but verify these settings are correct:

### 1. Authentication Providers

Open **Firebase Console → Authentication → Sign-in method** and confirm these providers are enabled:

- [x] Email/Password
- [x] Apple
- [x] Google
- [x] Facebook

### 2. Android SHA Fingerprints (Google Sign-In)

For Google Sign-In to work on Android with the native SDK, your app's SHA-1 and SHA-256 fingerprints must be registered in Firebase.

1. Open **Firebase Console → Project Settings → Your apps → Android app**
2. Under **SHA certificate fingerprints**, verify you have entries for:
   - Your **debug** keystore SHA-1 (for dev builds)
   - Your **release** keystore SHA-1 (for production builds)

To get your debug keystore fingerprint:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

If fingerprints are missing, add them and download a fresh `google-services.json`.

### 3. iOS URL Schemes (Google Sign-In)

The `GoogleService-Info.plist` contains a `REVERSED_CLIENT_ID` that must be added as a URL scheme in the iOS project. The `@react-native-google-signin/google-signin` Expo plugin handles this automatically during prebuild.

### 4. Native Config Files

Verify these files exist in the project root and match your Firebase project:

- `GoogleService-Info.plist` — iOS config (project ID: `overdue-app-dev`)
- `google-services.json` — Android config (project ID: `overdue-app-dev`)

If you need fresh copies: **Firebase Console → Project Settings → Your apps → Download config file**

## Rebuilding After Migration

React Native Firebase requires native modules that are not available in Expo Go. You must use a **development build**.

### Steps

```bash
# 1. Install dependencies
pnpm install

# 2. Regenerate native projects with RNFirebase native modules
npx expo prebuild --clean

# 3. Build and run on iOS
npx expo run:ios

# 4. Build and run on Android
npx expo run:android
```

### Important Notes

- **Expo Go is no longer supported.** The app requires a custom development build because `@react-native-firebase` includes native code.
- After running `prebuild --clean`, the `ios/` and `android/` directories are regenerated. Any manual native changes will be lost (use config plugins for native customizations).
- If you encounter pod install failures on iOS, try: `cd ios && pod install --repo-update`

## Offline Persistence

Firestore disk persistence is **enabled by default** with React Native Firebase on both iOS and Android. No additional configuration is needed.

### What This Means

- Documents fetched while online are cached to disk
- Queries served from cache when offline (with `fromCache: true` metadata)
- Writes made offline are queued and synced automatically when connectivity returns
- Cache survives app restarts (unlike the Web SDK's in-memory-only cache)

### Cache Size

The default cache size is 100 MB. If you need to customize this, you can set it during Firestore initialization:

```typescript
import firestore from '@react-native-firebase/firestore';

// Set cache size to 50MB (in bytes)
firestore().settings({ cacheSizeBytes: 50 * 1024 * 1024 });
```

## Switching Firebase Environments

The native config files (`GoogleService-Info.plist` and `google-services.json`) determine which Firebase project the app connects to. To switch between dev and prod:

1. Replace the config files with the ones for the target environment
2. Run `npx expo prebuild --clean` to regenerate native projects
3. Rebuild the dev client

The `app.config.js` `extra` section still contains Firebase env vars for reference, but they are no longer used for SDK initialization — the native config files are the source of truth.
