# Complete Auth Provider Setup Plan

This covers every step needed to configure Apple, Google, and Facebook authentication for the Overdue app — provider side, Firebase side, and code side.

---

## Part 1: Apple Sign-In

### 1A. Apple Developer Program (PROVIDER SIDE)

1. Go to [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/)
2. Sign in with your Apple ID (must have two-factor auth enabled)
3. Enroll as an **Individual** ($99 USD/year)
4. Complete identity verification (may require government-issued photo ID)
5. Wait for Apple to approve your enrollment (usually 24-48 hours, sometimes instant)

### 1B. Register App ID & Enable Sign In with Apple (PROVIDER SIDE)

1. Go to [Apple Developer > Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
2. Click **Identifiers** in the left sidebar
3. Click the **+** button to register a new identifier
4. Select **App IDs**, click Continue
5. Select **App** (not App Clip), click Continue
6. Fill in:
   - **Description**: `Overdue App`
   - **Bundle ID**: Select **Explicit**, enter `com.overdueapp.mobile` (must match your `app.config.js`)
7. Scroll down to **Capabilities**, check **Sign In with Apple**
8. Click **Continue**, then **Register**

### 1C. Create a Service ID (PROVIDER SIDE)

This is needed for Firebase to validate Apple tokens.

1. Still in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
2. Click **Identifiers**, then the **+** button
3. This time select **Services IDs**, click Continue
4. Fill in:
   - **Description**: `Overdue App Sign In` (whatever you like)
   - **Identifier**: `com.overdueapp.mobile.signin` (convention: your bundle ID + `.signin`)
5. Click **Continue**, then **Register**
6. Now click on the Service ID you just created to edit it
7. Check **Sign In with Apple**, click **Configure**
8. In the configuration dialog:
   - **Primary App ID**: Select your `com.overdueapp.mobile` App ID
   - **Domains and Subdomains**: Enter `overdue-app-dev.firebaseapp.com` (your Firebase auth domain from `.env.local`)
   - **Return URLs**: Enter `https://overdue-app-dev.firebaseapp.com/__/auth/handler`
9. Click **Save**, then **Continue**, then **Save**
10. **Write down the Service ID identifier** (`com.overdueapp.mobile.signin`) — you'll need it for Firebase

### 1D. Create a Sign In with Apple Private Key (PROVIDER SIDE)

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources), click **Keys** in the left sidebar
2. Click the **+** button
3. Fill in:
   - **Key Name**: `Overdue App Sign In Key`
4. Check **Sign In with Apple**, click **Configure**
5. Select your **Primary App ID** (`com.overdueapp.mobile`), click **Save**
6. Click **Continue**, then **Register**
7. **Download the `.p8` key file** — you can only download this ONCE, store it safely
8. **Write down the Key ID** shown on the confirmation page
9. **Write down your Team ID** — find it at the top-right of the Apple Developer portal, or at [Account > Membership Details](https://developer.apple.com/account#MembershipDetailsCard)

### 1E. Enable Apple Provider in Firebase (FIREBASE SIDE)

1. Go to [Firebase Console](https://console.firebase.google.com/) and open your `overdue-app-dev` project
2. In the left sidebar, click **Build** > **Authentication**
3. Click the **Sign-in method** tab
4. Click **Add new provider**
5. Select **Apple**
6. Toggle the **Enable** switch on
7. Fill in the **OAuth code flow configuration** section:
   - **Service ID**: `com.overdueapp.mobile.signin` (from step 1C)
   - **Apple Team ID**: Your Team ID (from step 1D)
   - **Key ID**: The Key ID from step 1D
   - **Private Key**: Open the `.p8` file in a text editor, copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`), paste it here
8. Click **Save**

### 1F. Code Side

**Already done.** `app.config.js` already has:
- `ios.usesAppleSignIn: true`
- `expo-apple-authentication` plugin

`auth-service.ts` already has a working `signInWithApple()` function.

---

## Part 2: Google Sign-In

### 2A. Add iOS and Android Apps in Firebase (FIREBASE SIDE)

You may already have a Web app configured (based on `.env.local`). Now you need native app entries.

**Add iOS app:**
1. Go to [Firebase Console](https://console.firebase.google.com/) > your project
2. Click the gear icon next to **Project Overview** > **Project settings**
3. Scroll to **Your apps** section, click **Add app** > iOS icon
4. **Apple bundle ID**: `com.overdueapp.mobile`
5. **App nickname**: `Overdue (iOS)` (optional)
6. Click **Register app**
7. **Download `GoogleService-Info.plist`** — save it to the ROOT of your project (next to `app.config.js`)
8. Click through the remaining steps (skip SDK installation, you're using Expo)

**Add Android app:**
1. Same settings page, click **Add app** > Android icon
2. **Android package name**: `com.overdueapp.mobile`
3. **App nickname**: `Overdue (Android)` (optional)
4. **Debug signing certificate SHA-1**: Skip for now, you'll add it in step 2D
5. Click **Register app**
6. **Download `google-services.json`** — save it to the ROOT of your project
7. Click through the remaining steps

### 2B. Enable Google Provider in Firebase (FIREBASE SIDE)

1. In Firebase Console > **Authentication** > **Sign-in method** tab
2. Click **Add new provider** (or click Google if it's listed)
3. Select **Google**
4. Toggle **Enable** on
5. Set a **Project support email** (your email)
6. Click **Save**

### 2C. Get the Web Client ID (FIREBASE SIDE)

When you enable Google in Firebase, it automatically creates OAuth client IDs in Google Cloud Console.

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials) (make sure you're in the right project — it should say `overdue-app-dev` at the top)
2. Under **OAuth 2.0 Client IDs**, find the one labeled **Web client (auto created by Google Service)**
3. Click on it
4. **Copy the Client ID** — it looks like `446088242577-xxxxxxxxxxxx.apps.googleusercontent.com`
5. This is your `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### 2D. Add SHA-1 Fingerprints for Android (FIREBASE SIDE)

You need SHA-1 certificates so Google can verify your Android app.

**For local debug builds:**
1. Run from your project root:

```bash
cd android && ./gradlew signingReport
```

(You may need to run `npx expo prebuild` first to generate the `android` directory.)

2. In the output, find the `debug` variant's `SHA1` value
3. Copy the SHA-1 hash

**For EAS builds:**
1. Run:

```bash
eas credentials -p android
```

2. Select your profile, and it will display the SHA-1 fingerprint

**Add to Firebase:**
1. Go to Firebase Console > **Project settings** > **Your apps** > your Android app
2. Click **Add fingerprint**
3. Paste each SHA-1 fingerprint
4. After adding fingerprints, **re-download `google-services.json`** (it gets updated)
5. Replace the old file in your project root

### 2E. Update app.config.js (CODE SIDE)

`app.config.js` needs the paths to the service files. Update the `ios` and `android` sections:

In `app.config.js`, add `googleServicesFile` to the `ios` block:
```javascript
ios: {
  supportsTablet: true,
  bundleIdentifier: 'com.overdueapp.mobile',
  usesAppleSignIn: true,
  googleServicesFile: './GoogleService-Info.plist',
},
```

Add `googleServicesFile` to the `android` block:
```javascript
android: {
  // ...existing config...
  googleServicesFile: './google-services.json',
},
```

### 2F. Update .env.local (CODE SIDE)

Replace the placeholder in `.env.local`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=446088242577-xxxxxxxxxxxx.apps.googleusercontent.com
```

(Use the actual Web Client ID from step 2C.)

### 2G. Code Side

**Already done.** `auth-service.ts` already has:
- Conditional `require()` for `@react-native-google-signin/google-signin`
- `GoogleSignin.configure()` with the web client ID
- `signInWithGoogle()` function
- The config plugin in `app.config.js`

---

## Part 3: Facebook Sign-In

### 3A. Register as a Meta Developer (PROVIDER SIDE)

1. Go to [https://developers.facebook.com/](https://developers.facebook.com/)
2. Click **Get Started** or **My Apps** (top right)
3. Log in with your personal Facebook account
4. If prompted, click **Register** to register as a developer
5. Verify your account with a phone number and email
6. Accept the Meta Platform Terms

### 3B. Create a Facebook App (PROVIDER SIDE)

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Select use case: **Authenticate and request data from users with Facebook Login**
4. Click **Next**
5. **App name**: `Overdue`
6. **App contact email**: Your email
7. Click **Create App**
8. You'll be taken to the app dashboard

### 3C. Get Your App ID, App Secret, and Client Token (PROVIDER SIDE)

**App ID:**
1. Your App ID is displayed at the top of the dashboard
2. **Copy it** — this is your `EXPO_PUBLIC_FACEBOOK_APP_ID`

**App Secret:**
1. In the left sidebar, go to **App Settings** > **Basic**
2. Next to **App Secret**, click **Show**
3. Enter your Facebook password to reveal it
4. **Copy it** — you'll need this for Firebase (NOT for your `.env.local`)

**Client Token:**
1. In the left sidebar, go to **App Settings** > **Advanced**
2. Scroll to the **Security** section
3. Find **Client Token**
4. **Copy it** — this is your `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN`

### 3D. Configure Facebook Login Settings (PROVIDER SIDE)

1. In the left sidebar, click **Use cases** > **Authenticate and request data from users with Facebook Login** > **Customize**
2. Under **Settings**, find **Valid OAuth Redirect URIs**
3. Add: `https://overdue-app-dev.firebaseapp.com/__/auth/handler`
4. Click **Save Changes**

### 3E. Add iOS and Android Platforms (PROVIDER SIDE)

1. Go to **App Settings** > **Basic**
2. Scroll to the bottom, click **+ Add Platform**

**For iOS:**
1. Select **iOS**
2. **Bundle ID**: `com.overdueapp.mobile`
3. Toggle **Single Sign On** to Yes
4. Click **Save Changes**

**For Android:**
1. Click **+ Add Platform** again, select **Android**
2. **Google Play Package Name**: `com.overdueapp.mobile`
3. **Class Name**: `com.overdueapp.mobile.MainActivity`
4. **Key Hashes**: Take the SHA-1 fingerprint from step 2D, [convert it from hex to Base64](https://base64.guru/converter/encode/hex), and paste it here
5. Toggle **Single Sign On** to Yes
6. Click **Save Changes**

### 3F. Enable Facebook Provider in Firebase (FIREBASE SIDE)

1. Go to Firebase Console > **Authentication** > **Sign-in method** tab
2. Click **Add new provider**
3. Select **Facebook**
4. Toggle **Enable** on
5. **App ID**: Paste the Facebook App ID from step 3C
6. **App secret**: Paste the App Secret from step 3C
7. **Copy the OAuth redirect URI** shown at the bottom — it should be `https://overdue-app-dev.firebaseapp.com/__/auth/handler` (confirm this matches what you added in step 3D)
8. Click **Save**

### 3G. Update .env.local (CODE SIDE)

Replace the placeholders in `.env.local`:

```
EXPO_PUBLIC_FACEBOOK_APP_ID=123456789012345
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=abcdef1234567890abcdef
```

(Use the actual values from step 3C.)

### 3H. Code Side

**Already done.** `auth-service.ts` already has:
- Conditional `require()` for `react-native-fbsdk-next`
- `signInWithFacebook()` function
- The config plugin in `app.config.js` with `appID`, `clientToken`, `displayName`, and `scheme`

---

## Part 4: Build & Test

### 4A. Verify Expo Go Still Works

1. Run `npx expo start`
2. Open in Expo Go
3. Confirm the sign-in screen loads with:
   - Email/password fields (functional)
   - Apple button (functional on real iOS device)
   - Google "Continue with Google" placeholder button (shows alert on tap)
   - Facebook "Continue with Facebook" placeholder button (shows alert on tap)

### 4B. Create a Development Build for Full Testing

```bash
# Generate native project files
npx expo prebuild --clean

# Run locally on iOS simulator/device
npx expo run:ios

# Run locally on Android emulator/device
npx expo run:android
```

Or using EAS Build:

```bash
# First time: configure EAS
eas build:configure

# Build development client
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 4C. Test Each Provider

In the development build:

1. **Email/password**: Create an account, sign in, sign out
2. **Apple**: Tap the native Apple button, complete the Apple ID flow, verify user appears in Firebase Console > Authentication > Users
3. **Google**: Tap the native Google button, complete the Google account selection, verify user appears in Firebase
4. **Facebook**: Tap "Continue with Facebook", complete the Facebook login flow, verify user appears in Firebase

### 4D. Before Going to Production

1. **Facebook**: In the Meta App Dashboard, switch your app from **Development** to **Live** mode:
   - Go to the app dashboard top bar, toggle from **Development** to **Live**
   - You'll need to complete a Data Use Checkup and provide a Privacy Policy URL
2. **Google Play Store (Android)**: After uploading to Play Store, add the Play App Signing SHA-1 fingerprints:
   - Google Play Console > Release > Setup > App Integrity > App signing key certificate
   - Add these SHA-1s to both Firebase (step 2D) and Facebook (step 3E)
3. **App Store (iOS)**: Apple Sign-In should work automatically since the bundle ID and capability are configured
4. **Privacy Policy**: All three providers require a publicly accessible privacy policy URL for your app

---

## Quick Reference: Files You'll Touch

| File | What to change |
|---|---|
| `.env.local` | Add real values for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_FACEBOOK_APP_ID`, `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` |
| `app.config.js` | Add `googleServicesFile` paths to `ios` and `android` blocks |
| `GoogleService-Info.plist` | Download from Firebase, place in project root |
| `google-services.json` | Download from Firebase, place in project root |

## Quick Reference: Console Accounts Needed

| Service | URL | What you need |
|---|---|---|
| Apple Developer Program | [developer.apple.com/programs](https://developer.apple.com/programs/) | $99/year membership |
| Firebase Console | [console.firebase.google.com](https://console.firebase.google.com/) | Free (Spark plan is fine for auth) |
| Google Cloud Console | [console.cloud.google.com](https://console.cloud.google.com/) | Auto-linked from Firebase project |
| Meta for Developers | [developers.facebook.com](https://developers.facebook.com/) | Free, requires personal Facebook account |
