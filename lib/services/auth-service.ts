/**
 * Authentication service
 * Handles all Firebase Auth operations including social sign-in (Apple, Google, Facebook).
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { digestStringAsync, CryptoDigestAlgorithm, getRandomBytes } from 'expo-crypto';
import {
  AppleAuthProvider,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  type FirebaseAuthTypes,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from '@react-native-firebase/auth';
import { auth } from '../firebase/config';
import { createDefaultHousehold } from './household-service';
import { createUserProfile, getUserProfile } from './user-service';

const GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

const { LoginManager, AccessToken } = require('react-native-fbsdk-next');

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email, password, and display name
 */
export async function signUp({ email, password, displayName }: SignUpParams): Promise<FirebaseAuthTypes.User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, { displayName });

    await sendEmailVerification(userCredential.user);

    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInParams): Promise<FirebaseAuthTypes.User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Resend email verification to current user
 */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  try {
    await sendEmailVerification(user);
  } catch (error: any) {
    console.error('Resend verification error:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
}

/**
 * Sign in with Apple
 * Handles the full Apple Sign-In flow:
 * 1. Generate a secure nonce for Firebase
 * 2. Authenticate with Apple
 * 3. Sign in to Firebase with Apple credential
 * 4. Create Firestore profile + default household for new users
 */
export async function signInWithApple(): Promise<FirebaseAuthTypes.User> {
  try {
    const rawNonce = generateNonce();
    const hashedNonce = await digestStringAsync(
      CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      throw new Error('No identity token received from Apple');
    }

    const oAuthCredential = AppleAuthProvider.credential(
      appleCredential.identityToken,
      rawNonce,
    );

    const result = await signInWithCredential(auth, oAuthCredential);

    const displayName = appleCredential.fullName
      ? [appleCredential.fullName.givenName, appleCredential.fullName.familyName]
          .filter(Boolean)
          .join(' ') || null
      : null;

    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    const existingProfile = await getUserProfile(result.user.uid);
    if (!existingProfile) {
      await createUserProfile({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: displayName || result.user.displayName || 'User',
        emailVerified: true,
      });
      await createDefaultHousehold(result.user.uid);
    }

    return result.user;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw error;
    }
    console.error('Apple sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with Google
 * Uses the native Google Sign-In SDK -> Firebase credential flow.
 */
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    const existingProfile = await getUserProfile(result.user.uid);
    if (!existingProfile) {
      await createUserProfile({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'User',
        emailVerified: result.user.emailVerified,
      });
      await createDefaultHousehold(result.user.uid);
    }

    return result.user;
  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === 'ERR_REQUEST_CANCELED') {
      throw error;
    }
    console.error('Google sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with Facebook
 * Uses the native Facebook SDK -> Firebase credential flow.
 */
export async function signInWithFacebook(): Promise<FirebaseAuthTypes.User> {
  try {
    const loginResult = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (loginResult.isCancelled) {
      const cancelError: any = new Error('User cancelled Facebook login');
      cancelError.code = 'ERR_REQUEST_CANCELED';
      throw cancelError;
    }

    const tokenData = await AccessToken.getCurrentAccessToken();
    if (!tokenData?.accessToken) {
      throw new Error('No access token received from Facebook');
    }

    const credential = FacebookAuthProvider.credential(tokenData.accessToken);
    const result = await signInWithCredential(auth, credential);

    const existingProfile = await getUserProfile(result.user.uid);
    if (!existingProfile) {
      await createUserProfile({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'User',
        emailVerified: result.user.emailVerified,
      });
      await createDefaultHousehold(result.user.uid);
    }

    return result.user;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw error;
    }
    console.error('Facebook sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Generate a cryptographically secure random nonce string
 */
function generateNonce(length = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = getRandomBytes(length);
  return Array.from(randomBytes)
    .map((byte) => charset[byte % charset.length])
    .join('');
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'An error occurred. Please try again.';
  }
}
