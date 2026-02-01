# Firestore Security Rules Deployment Guide

## Overview

Firestore security rules control access to your database. They must be deployed to both development and production Firebase projects.

## Rules Location

The security rules are defined in `firestore.rules` at the project root.

## Deploying Rules

### Option 1: Firebase Console (Recommended for Initial Setup)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (dev or prod)
3. Navigate to Firestore Database > Rules
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click "Publish"
7. Repeat for the other project

### Option 2: Firebase CLI (Recommended for Updates)

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (first time only):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept the default firestore.rules location
   - Accept or skip the firestore.indexes.json setup

4. Deploy rules to development:
   ```bash
   firebase use overdue-app-dev
   firebase deploy --only firestore:rules
   ```

5. Deploy rules to production:
   ```bash
   firebase use overdue-app-prod
   firebase deploy --only firestore:rules
   ```

## Testing Rules

### Using Firebase Emulator (Local Testing)

1. Start the Firestore emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Update your app to point to the emulator (in development):
   ```typescript
   import { connectFirestoreEmulator } from 'firebase/firestore';
   
   if (__DEV__) {
     connectFirestoreEmulator(firestore, 'localhost', 8080);
   }
   ```

### Using Rules Playground (Firebase Console)

1. Go to Firebase Console > Firestore Database > Rules
2. Click on "Rules playground" tab
3. Test read/write operations with different auth scenarios

## Rule Validation

Before deploying, verify:

1. **Authentication required**: All operations require `request.auth != null`
2. **User isolation**: Users can only access their own data
3. **Household membership**: Users can only access households they belong to
4. **Owner permissions**: Only household owners can modify household settings
5. **No public access**: No unauthenticated access allowed

## Common Issues

### Issue: "Missing or insufficient permissions"
- **Cause**: User trying to access data they don't have permission for
- **Fix**: Check that user is authenticated and has proper household membership

### Issue: "Rules deployment failed"
- **Cause**: Syntax error in rules file
- **Fix**: Validate rules syntax in Firebase Console rules editor

### Issue: "Function not found"
- **Cause**: Typo in helper function name
- **Fix**: Check all function calls match defined helper functions

## Phase-Specific Rules

### Phase 1 (Current)
- ✅ Users collection
- ✅ Households collection
- ✅ HouseholdMembers collection
- ⏳ Chores collection (ready but unused)
- ⏳ Invites collection (ready but unused)

### Phase 2 (Upcoming)
- Invites collection will be activated
- Additional household creation permissions

### Phase 3 (Upcoming)
- Chores collection will be activated
- Completion tracking permissions

## Security Checklist

Before going to production:

- [ ] Deploy rules to both dev and production
- [ ] Test authentication flow
- [ ] Test user profile creation
- [ ] Test household creation
- [ ] Test membership queries
- [ ] Verify no unauthorized access possible
- [ ] Test sign-out (ensure no lingering access)
- [ ] Test with multiple users
