# Firebase Setup Guide

## Create Firebase Projects

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create two projects:
   - `overdue-app-dev` (Development)
   - `overdue-app-prod` (Production)

## Configure Authentication

For each project:
1. Go to Authentication > Sign-in method
2. Enable Email/Password provider
3. Configure email templates (Password reset, Email verification)
4. (Phase 1.1) Enable Google, Apple, and Facebook providers

## Configure Firestore

For each project:
1. Go to Firestore Database
2. Create database in production mode
3. Choose a location close to your users
4. Apply initial security rules (see below)

## Enable Cloud Messaging

For each project:
1. Go to Project Settings > Cloud Messaging
2. Note the Server Key for future push notification setup

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase Configuration (Development)
EXPO_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=overdue-app-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=overdue-app-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=overdue-app-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-dev-app-id
EXPO_PUBLIC_ENV=development
```

For production builds, create `.env.production` with production credentials.

## Get Firebase Config

**Important:** Even though this is a mobile app, you need the **Web SDK** config because we're using Expo managed workflow with the Firebase JavaScript SDK (not native Firebase packages).

For each project:
1. Go to Project Settings > General
2. Scroll to "Your apps"
3. Click "Add app" and select **Web (</>) platform**
4. Register app with nickname "Overdue App Dev" or "Overdue App Prod"
5. Copy the config values to your `.env.local` file

**Why Web config?** Expo managed workflow uses the Firebase JavaScript SDK, which requires web credentials. Native iOS/Android configs are only needed for bare React Native apps using `@react-native-firebase` packages.

## Firestore Security Rules

**Important:** The project includes a complete `firestore.rules` file at the root with proper access controls. Deploy this file instead of using basic rules.

The rules include:
- ✅ User profile isolation (users can only access their own profile)
- ✅ Household membership checks (users can only access households they belong to)
- ✅ Owner permissions (only owners can modify household settings)
- ✅ Chore access control (household members can manage chores)
- ✅ Invite management (for Phase 2+)

**Do NOT use this simple example:**
```javascript
// ❌ Too permissive - don't use this
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

**Instead, deploy the actual rules file:**
```bash
firebase deploy --only firestore:rules
```

This will deploy the comprehensive rules from `firestore.rules` at the project root.
