/**
 * Invite Member Modal
 * Modal component for sending household invitations
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Colors } from '@/constants/theme';
import { useCreateInvite } from '@/lib/hooks/use-invites';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { HouseholdRole } from '@/lib/types/household';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
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
  const translateY = useRef(new Animated.Value(0)).current;

  const createInviteMutation = useCreateInvite(householdId);

  const { isOnline } = useNetworkStatus();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({}, 'cardBackground');

  // Handle keyboard show/hide with smooth animation
  useEffect(() => {
    if (!visible) {
      translateY.setValue(0);
      return;
    }

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        const screenHeight = Dimensions.get('window').height;
        
        // Calculate how much we need to move up to clear the keyboard
        // Modal is centered, so its bottom is at screenHeight/2 + modalHeight/2
        // We want to move it so the bottom is at (screenHeight - keyboardHeight - padding)
        const padding = 20;
        const estimatedModalHeight = 380; // Approximate height of modal (taller due to role selection)
        const modalBottom = screenHeight / 2 + estimatedModalHeight / 2;
        const targetBottom = screenHeight - keyboardHeight - padding;
        const moveAmount = modalBottom - targetBottom;
        
        // Only move if the modal would overlap with keyboard
        if (moveAmount > 0) {
          Animated.timing(translateY, {
            toValue: -moveAmount,
            duration: Platform.OS === 'ios' ? Math.min(e.duration || 250, 250) : 200,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(translateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? Math.min(e.duration || 250, 250) : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    // Focus input with delay for smooth transition
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      clearTimeout(timer);
    };
  }, [visible, translateY]);

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <ThemedView
            style={[styles.modalContent, { backgroundColor }]}
            lightColor={Colors.light.background}
            darkColor={Colors.dark.background}
          >
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Invite Member
          </ThemedText>

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: borderColor,
                color: textColor,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="member@example.com"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <ThemedText style={styles.label}>Role</ThemedText>
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

          <ThemedText style={styles.helpText}>
            Admins can invite members and manage household settings.
          </ThemedText>

          {!isOnline && (
            <ThemedView style={[styles.offlineWarning, { borderColor }]}>
              <ThemedText style={styles.offlineText}>
                ⚠️ You are offline. You must be connected to send invitations.
              </ThemedText>
            </ThemedView>
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
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  offlineWarning: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});
