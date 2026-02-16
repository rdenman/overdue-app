/**
 * Sign In screen
 * Email/password, Apple, Google, and Facebook authentication.
 * Social buttons use custom branded Pressables that follow each
 * provider's branding guidelines (Apple HIG, Google Identity, Meta).
 * In Expo Go, Google and Facebook show an informational alert since
 * the native SDKs are unavailable.
 */

import { GoogleLogo } from '@/components/icons/google-logo';
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
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
          <View style={styles.brandingContainer}>
            <Typography variant="title" style={styles.appName}>
              Overdue
            </Typography>
            <Typography muted style={styles.tagline}>
              Never fall behind.
            </Typography>
          </View>

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

            {/* Apple – HIG: black button / white text (light), white button / black text (dark) */}
            {appleAuthAvailable && (
              <Pressable
                style={[
                  styles.socialButton,
                  styles.socialButtonRow,
                  theme === 'dark' ? styles.appleButtonLight : styles.appleButtonDark,
                  loading && styles.socialDisabled,
                ]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={theme === 'dark' ? '#000' : '#fff'}
                  style={styles.socialIcon}
                />
                <Text
                  style={[
                    styles.socialButtonText,
                    { color: theme === 'dark' ? '#000' : '#fff' },
                  ]}
                >
                  Continue with Apple
                </Text>
              </Pressable>
            )}

            {/* Google – Branding: white surface / dark text (light), #131314 surface / light text (dark) */}
            <Pressable
              style={[
                styles.socialButton,
                styles.socialButtonRow,
                theme === 'dark' ? styles.googleButtonDark : styles.googleButtonLight,
                loading && styles.socialDisabled,
              ]}
              onPress={isExpoGo ? () => showExpoGoAlert('Google') : handleGoogleSignIn}
              disabled={loading}
            >
              <View style={styles.socialIcon}>
                <GoogleLogo size={18} />
              </View>
              <Text
                style={[
                  styles.socialButtonText,
                  { color: theme === 'dark' ? '#e3e3e3' : '#3c4043' },
                ]}
              >
                Continue with Google
              </Text>
            </Pressable>

            {/* Facebook – Branding: #1877F2 surface / white text */}
            <Pressable
              style={[
                styles.socialButton,
                styles.socialButtonRow,
                styles.facebookButton,
                loading && styles.socialDisabled,
              ]}
              onPress={isExpoGo ? () => showExpoGoAlert('Facebook') : handleFacebookSignIn}
              disabled={loading}
            >
              <Ionicons
                name="logo-facebook"
                size={20}
                color="#fff"
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, { color: '#fff' }]}>
                Continue with Facebook
              </Text>
            </Pressable>

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
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
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
    borderRadius: 8,
  },
  socialButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialDisabled: {
    opacity: 0.6,
  },
  appleButtonDark: {
    backgroundColor: '#000',
  },
  appleButtonLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  googleButtonLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleButtonDark: {
    backgroundColor: '#131314',
    borderWidth: 1,
    borderColor: '#8e918f',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
});
