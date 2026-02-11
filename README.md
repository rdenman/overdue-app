# Overdue - Household Chore Tracking App

A mobile-first chore tracking app that helps households coordinate recurring tasks. Built with Expo, Firebase, and designed to be **offline-first** with a focus on simplicity and reliability.

## Project Status

**Phase 2 Complete** ✅

- ✅ Firebase integration with offline persistence
- ✅ Email/password authentication
- ✅ User profiles and default household creation
- ✅ Email verification
- ✅ Protected routes and navigation
- ✅ Firestore security rules deployed
- ✅ Manual household creation
- ✅ Household invitations (email-based)
- ✅ Household member management
- ✅ Invitation acceptance/decline flow

**Coming Next:** Phase 3 - Chore CRUD operations

## Tech Stack

- **Framework:** [Expo](https://expo.dev) (managed workflow, SDK 54)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **Backend:** Firebase
  - Firebase Auth (email/password, social auth in Phase 1.1)
  - Firestore (with offline persistence)
  - Cloud Functions (future phases)
  - Cloud Messaging (for push notifications)
- **Animations:** React Native Reanimated
- **State Management:** React Context API

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **pnpm** (v8 or later) - `npm install -g pnpm`
- **Expo CLI** - `npm install -g expo-cli`
- **Firebase CLI** - `npm install -g firebase-tools`
- **iOS Development** (Mac only):
  - Xcode (latest version from App Store)
  - iOS Simulator
- **Android Development:**
  - Android Studio
  - Android SDK and emulator configured

### Optional Tools

- **Expo Go** app on your phone for testing (limited features)
- **EAS CLI** for building production apps - `npm install -g eas-cli`

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd overdue-app
pnpm install
```

### 2. Firebase Setup

Create two Firebase projects (development and production):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `overdue-app-dev`
3. Create project: `overdue-app-prod`

For each project:
- Enable **Authentication** > Email/Password provider
- Create **Firestore Database** in production mode
- Enable **Cloud Messaging**
- Add a **Web app** and copy the config

See [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) for detailed instructions.

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Firebase Development Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=overdue-app-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=overdue-app-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=overdue-app-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-dev-app-id
EXPO_PUBLIC_ENV=development
```

Replace the placeholder values with your actual Firebase config from the Firebase Console.

### 4. Deploy Firestore Security Rules

Update `.firebaserc` with your Firebase project IDs, then deploy:

```bash
# Login to Firebase
firebase login

# Deploy to development
firebase use dev
firebase deploy --only firestore:rules

# Deploy to production (when ready)
firebase use prod
firebase deploy --only firestore:rules
```

### 5. Start the Development Server

```bash
pnpm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go (limited functionality)

## Development

### Project Structure

```
overdue-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Today's Chores
│   │   └── explore.tsx      # Households
│   └── _layout.tsx          # Root layout with providers
├── components/              # Reusable React components
├── lib/                     # Business logic
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Firebase service layer
│   ├── types/              # TypeScript type definitions
│   └── firebase/           # Firebase configuration
├── docs/                    # Project documentation
├── assets/                  # Images, fonts, etc.
├── firestore.rules         # Firestore security rules
└── firestore.indexes.json  # Firestore indexes
```

### Available Scripts

```bash
# Start development server
pnpm start

# Start with cache cleared
pnpm start --clear

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run linter
pnpm lint

# Type check
pnpm tsc --noEmit

# Seed test data (creates test users, households, and chores)
pnpm seed

# Clean up test data (removes all test users and their data)
pnpm cleanup
```

### Code Style Guidelines

This project follows strict guidelines (see [`.cursor/rules.md`](.cursor/rules.md)):

- **TypeScript everywhere** - No `any` types
- **Max ~300 LOC per file** - Keep files focused and small
- **Strong typing** - Use interfaces and type definitions
- **Offline-first** - UI must work without network
- **No future-proofing** - Build only what's needed now
- **Follow the charter** - All features must be in [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)

### Test Data for Development

For local development, you can quickly populate your database with realistic test data:

```bash
# Create test users, households, and chores
pnpm seed
```

This creates:
- **3 test users:** test1@test.com, test2@test.com, test3@test.com (password: `Password1!`)
- **Personal households** for each user
- **Family household** with all 3 users
- **Parents household** with 2 users
- **20-30 chores per household** with variety in due dates, assignments, and intervals

When you're done testing:

```bash
# Remove all test data
pnpm cleanup
```

See [`scripts/README.md`](scripts/README.md) for more details.

### Testing User Flows

1. **Sign Up Flow:**
   - Create account with email/password/displayName
   - Verify email verification banner appears
   - Check that "Personal" household is auto-created
   
2. **Sign In Flow:**
   - Sign out and sign back in
   - Verify auth state persists
   
3. **Password Reset:**
   - Test forgot password flow
   - Check email delivery

4. **Household Management:**
   - Create a new household
   - Invite a member by email
   - Accept/decline invitations
   - View household members
   - Manage household settings

## Documentation

- **[Project Charter](docs/PROJECT_CHARTER.md)** - Product requirements and principles
- **[Firebase Setup](docs/FIREBASE_SETUP.md)** - Detailed Firebase configuration guide
- **[Firestore Schema](docs/FIRESTORE_SCHEMA.md)** - Database structure and relationships
- **[Security Rules Deployment](docs/SECURITY_RULES_DEPLOYMENT.md)** - How to deploy and test rules
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Phase 0 + 1 completion report
- **[Phase 2 Summary](docs/PHASE_2_SUMMARY.md)** - Phase 2 household management implementation
- **[Cursor Rules](.cursor/rules.md)** - Development guidelines for AI-assisted coding

## Firebase Configuration

### Switching Environments

```bash
# Use development environment
firebase use dev

# Use production environment
firebase use prod

# Check current environment
firebase use
```

### Deploying Updates

```bash
# Deploy security rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy
```

## Offline-First Architecture

This app is designed to work seamlessly offline:

- **Firestore offline persistence** enabled by default
- **Optimistic UI updates** - Changes appear instantly
- **Automatic sync** when connection returns
- **Last-write-wins** conflict resolution

Data flows:
1. User action → Service layer
2. Service layer → Firestore write (cached if offline)
3. Firestore listener → Real-time UI update

## Building for Production

### iOS

```bash
# Create production build
eas build --platform ios --profile production

# Create development build with dev client
eas build --platform ios --profile development
```

### Android

```bash
# Create production build
eas build --platform android --profile production

# Create development build
eas build --platform android --profile development
```

See [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for details.

## Troubleshooting

### Common Issues

**"Missing or insufficient permissions"**
- Ensure Firestore security rules are deployed
- Check that user is authenticated
- Verify user is a member of the household they're trying to access

**"Firebase config missing"**
- Verify `.env.local` exists and has all required variables
- Restart the Expo development server
- Check `app.config.js` is reading environment variables correctly

**"Cannot connect to Firebase"**
- Check your internet connection
- Verify Firebase project is active in Firebase Console
- Ensure API keys are correct

**App crashes on startup**
- Clear Expo cache: `pnpm start --clear`
- Delete `node_modules` and reinstall: `pnpm install`
- Check for TypeScript errors: `pnpm tsc --noEmit`

### Getting Help

1. Check the [docs/](docs/) folder for detailed guides
2. Review closed issues in the repository
3. Check Firebase Console for error logs
4. Review Expo logs in terminal

## Phase Roadmap

- ✅ **Phase 0:** Foundation & Infrastructure
- ✅ **Phase 1:** Authentication & Basic Data Access
- ✅ **Phase 2:** Household Management & Invitations
- ⏳ **Phase 3:** Chore CRUD Operations
- ⏳ **Phase 4:** Interval Scheduling & Completion Tracking
- ⏳ **Phase 5:** Overdue Detection & Notifications

## Contributing

This project follows a phased development approach:

1. All features must be defined in the [Project Charter](docs/PROJECT_CHARTER.md)
2. Follow the [Cursor Rules](.cursor/rules.md) for code style
3. One phase at a time - no future feature leakage
4. Max ~300 lines of code per file
5. Strong TypeScript typing throughout
6. Test all offline scenarios

## License

[Your License Here]

## Acknowledgments

Built with:
- [Expo](https://expo.dev)
- [Firebase](https://firebase.google.com)
- [React Native](https://reactnative.dev)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
