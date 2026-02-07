/**
 * Sign Up screen
 * New user registration with email, password, and display name
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { signUp } from '@/lib/services/auth-service';
import { createDefaultHousehold } from '@/lib/services/household-service';
import { createUserProfile } from '@/lib/services/user-service';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
            <ThemedText type="title" style={styles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Join to start tracking chores
            </ThemedText>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />

              <Button
                title="Sign Up"
                onPress={handleSignUp}
                size="lg"
                loading={loading}
                disabled={loading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity disabled={loading}>
                    <Text style={styles.link}>Sign In</Text>
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
    opacity: 0.7,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
