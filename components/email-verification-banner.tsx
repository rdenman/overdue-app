/**
 * EmailVerificationBanner
 * Displays a warning banner for unverified users with option to resend verification email
 */

import { useAuth } from '@/lib/hooks/use-auth';
import { resendVerificationEmail } from '@/lib/services/auth-service';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Email Sent', 'Verification email has been sent. Please check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.text}>
            ⚠️ Please verify your email address
          </Text>
          <Button
            title="Resend Email"
            variant="outlined"
            size="sm"
            onPress={handleResendEmail}
            loading={sending}
            disabled={sending}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  button: {
    backgroundColor: '#fff',
    borderColor: '#FFE69C',
    minWidth: 100,
  },
  buttonText: {
    color: '#007AFF',
  },
});
