/**
 * Sign Up screen
 * New user registration with email, password, and display name
 */

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { signUp } from '@/lib/services/auth-service';
import { createDefaultHousehold } from '@/lib/services/household-service';
import { createUserProfile } from '@/lib/services/user-service';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Auth account
      const user = await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });

      // Create user profile in Firestore
      await createUserProfile({
        uid: user.uid,
        email: user.email!,
        displayName: displayName.trim(),
        emailVerified: user.emailVerified,
      });

      // Create default "Personal" household
      await createDefaultHousehold(user.uid);

      // Navigation handled by AuthContext redirect
      Alert.alert(
        'Welcome!',
        'Your account has been created. Please check your email to verify your address.'
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Typography variant="title" style={styles.title}>
              Create Account
            </Typography>
            <Typography muted style={styles.subtitle}>
              Join to start tracking chores
            </Typography>

            <View style={styles.form}>
              <Input
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
                containerStyle={styles.inputContainer}
              />

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
                placeholder="Password (min. 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
                containerStyle={styles.inputContainer}
              />

              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
                containerStyle={styles.inputContainer}
              />

              <Button
                title="Sign Up"
                onPress={handleSignUp}
                size="lg"
                loading={loading}
                disabled={loading}
              />

              <View style={styles.footer}>
                <Typography muted>Already have an account? </Typography>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity disabled={loading}>
                    <Typography color="primary" variant="bodySemiBold">Sign In</Typography>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
