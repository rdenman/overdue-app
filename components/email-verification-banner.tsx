/**
 * EmailVerificationBanner
 * Displays a warning banner for unverified users with option to resend verification email
 */

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { resendVerificationEmail } from '@/lib/services/auth-service';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function EmailVerificationBanner() {
  const { user } = useAuth();
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
    <View style={styles.container}>
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
