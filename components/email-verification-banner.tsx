/**
 * EmailVerificationBanner
 * Displays a warning banner for unverified users with option to resend verification email
 */

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
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
  
  const warningBackground = useThemeColor({}, 'warningBackground');
  const warningBorder = useThemeColor({}, 'warningBorder');
  const warningText = useThemeColor({}, 'warningText');
  const warningButtonBackground = useThemeColor({}, 'warningButtonBackground');
  const buttonText = useThemeColor({}, 'buttonText');

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
    <View style={[styles.container, { backgroundColor: warningBackground, borderBottomColor: warningBorder }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: warningText }]}>
          ⚠️ Please verify your email address
        </Text>
        <Button
          title="Resend Email"
          variant="outlined"
          size="sm"
          onPress={handleResendEmail}
          loading={sending}
          disabled={sending}
          style={[styles.button, { backgroundColor: warningButtonBackground, borderColor: warningBorder }]}
          textStyle={[styles.buttonText, { color: buttonText }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
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
  },
  button: {
    minWidth: 100,
  },
  buttonText: {},
});
