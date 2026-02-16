/**
 * Sign In screen
 * Email/password, Apple, Google, and Facebook authentication.
 * Google & Facebook use native buttons in dev/production builds
 * and styled placeholders in Expo Go.
 */

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/lib/contexts/theme-context';
import {
  signIn,
  signInWithApple,
  signInWithFacebook,
  signInWithGoogle,
} from '@/lib/services/auth-service';
import { isExpoGo } from '@/lib/utils/expo-env';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// ---------------------------------------------------------------------------
// Conditionally load native social-auth button components (unavailable in Expo Go)
// ---------------------------------------------------------------------------
let GoogleSigninButton: any = null;
let LoginButton: any = null;

if (!isExpoGo) {
  GoogleSigninButton =
    require('@react-native-google-signin/google-signin').GoogleSigninButton;
  LoginButton = require('react-native-fbsdk-next').LoginButton;
}

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
    }
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      await signInWithFacebook();
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const showExpoGoAlert = (provider: string) => {
    Alert.alert(
      'Not Available',
      `${provider} Sign-In requires a development build. This button is a placeholder in Expo Go.`,
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Typography variant="title" style={styles.title}>
            Welcome Back
          </Typography>
          <Typography muted style={styles.subtitle}>
            Sign in to continue
          </Typography>

          <View style={styles.form}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
              containerStyle={styles.inputContainer}
            />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
              containerStyle={styles.inputContainer}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity disabled={loading}>
                <Typography variant="bodySmall" color="primary" style={styles.forgotPassword}>
                  Forgot password?
                </Typography>
              </TouchableOpacity>
            </Link>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              size="lg"
              loading={loading}
              disabled={loading}
            />

            {/* ---- Social sign-in section ---- */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Typography muted style={styles.dividerText}>or</Typography>
              <View style={styles.dividerLine} />
            </View>

            {/* Apple */}
            {appleAuthAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  theme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={8}
                style={styles.socialButton}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Google */}
            {isExpoGo ? (
              <Button
                title="Continue with Google"
                onPress={() => showExpoGoAlert('Google')}
                variant="outlined"
                size="lg"
                style={styles.socialButton}
                disabled={loading}
              />
            ) : (
              GoogleSigninButton && (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  style={styles.socialButton}
                />
              )
            )}

            {/* Facebook */}
            {isExpoGo ? (
              <Button
                title="Continue with Facebook"
                onPress={() => showExpoGoAlert('Facebook')}
                variant="outlined"
                size="lg"
                style={styles.socialButton}
                disabled={loading}
              />
            ) : (
              <Button
                title="Continue with Facebook"
                onPress={handleFacebookSignIn}
                variant="outlined"
                size="lg"
                style={styles.socialButton}
                disabled={loading}
              />
            )}

            <View style={styles.footer}>
              <Typography muted>Don&apos;t have an account? </Typography>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity disabled={loading}>
                  <Typography color="primary" variant="bodySemiBold">Sign Up</Typography>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPassword: {
    textAlign: 'right',
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#999',
  },
  dividerText: {
    marginHorizontal: 12,
  },
  socialButton: {
    width: '100%',
    height: 48,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
});
