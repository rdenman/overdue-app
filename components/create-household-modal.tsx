/**
 * Create Household Modal
 * Modal component for creating new households
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/lib/hooks/use-theme-color';
import { createHousehold } from '@/lib/services/household-service';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

interface CreateHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function CreateHouseholdModal({
  visible,
  onClose,
  onSuccess,
  userId,
}: CreateHouseholdModalProps) {
  const [householdName, setHouseholdName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const inputBg = useThemeColor({}, 'cardBackground');
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

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
        const estimatedModalHeight = 300; // Approximate height of modal
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

  const handleCreate = async () => {
    const trimmedName = householdName.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Error', 'Household name must be at least 3 characters');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Household name must be less than 50 characters');
      return;
    }

    try {
      setLoading(true);
      await createHousehold({
        name: trimmedName,
        ownerId: userId,
      });

      setHouseholdName('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating household:', error);
      Alert.alert('Error', error.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setHouseholdName('');
    onClose();
  };

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
            Create Household
          </ThemedText>

          <ThemedText style={styles.label}>Household Name</ThemedText>
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
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g., Family, Roommates, Office"
            placeholderTextColor={Colors.light.tabIconDefault}
            maxLength={50}
            editable={!loading}
          />

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton, { borderColor }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.createButton,
                { backgroundColor: tintColor },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={buttonTextColor} />
              ) : (
                <Text style={[styles.createButtonText, { color: buttonTextColor }]}>Create</Text>
              )}
            </Pressable>
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
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  createButton: {
    borderWidth: 0,
  },
  createButtonText: {
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
