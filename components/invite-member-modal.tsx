/**
 * Invite Member Modal
 * Modal component for sending household invitations
 */

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { ModalContainer } from '@/components/ui/modal-container';
import { Typography } from '@/components/ui/typography';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { useCreateInvite } from '@/lib/hooks/use-invites';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { HouseholdRole } from '@/lib/types/household';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  householdId: string;
  userId: string;
}

export function InviteMemberModal({
  visible,
  onClose,
  onSuccess,
  householdId,
  userId,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<HouseholdRole>('member');
  const inputRef = useRef<TextInput>(null);

  const createInviteMutation = useCreateInvite(householdId);

  const { isOnline } = useNetworkStatus();
  const borderColor = useThemeColor({}, 'border');

  // Focus input when modal becomes visible
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [visible]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSendInvite = async () => {
    // Check network connectivity (per PROJECT_CHARTER)
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'You must be online to send invitations. Please check your connection and try again.'
      );
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await createInviteMutation.mutateAsync({
        householdId,
        invitedBy: userId,
        invitedEmail: trimmedEmail,
        role,
      });

      setEmail('');
      setRole('member');
      onSuccess();
      onClose();
      Alert.alert('Success', 'Invitation sent successfully');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    }
  };

  const handleCancel = () => {
    setEmail('');
    setRole('member');
    onClose();
  };

  const loading = createInviteMutation.isPending;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title="Invite Member"
      estimatedHeight={380}
    >
      <Input
        ref={inputRef}
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="member@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        containerStyle={styles.inputContainer}
      />

      <Typography variant="label" style={styles.roleLabel}>Role</Typography>
      <View style={styles.roleContainer}>
        <Chip
          label="Member"
          selected={role === 'member'}
          onPress={() => setRole('member')}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Chip
          label="Admin"
          selected={role === 'admin'}
          onPress={() => setRole('admin')}
          disabled={loading}
          style={{ flex: 1 }}
        />
      </View>

      <Typography variant="caption" muted style={styles.helpText}>
        Admins can invite members and manage household settings.
      </Typography>

      {!isOnline && (
        <View style={[styles.offlineWarning, { borderColor }]}>
          <Typography variant="caption" style={styles.offlineText}>
            ⚠️ You are offline. You must be connected to send invitations.
          </Typography>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outlined"
          onPress={handleCancel}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          title="Send Invite"
          onPress={handleSendInvite}
          loading={loading}
          disabled={loading}
          style={{ flex: 1 }}
        />
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  helpText: {
    marginBottom: 12,
  },
  offlineWarning: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  offlineText: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});
