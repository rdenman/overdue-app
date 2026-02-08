/**
 * ModalContainer component
 * Shared overlay + animated container with keyboard-avoidance for bottom-sheet-style modals.
 * Extracted from create-household-modal and invite-member-modal.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Typography } from './typography';

export interface ModalContainerProps {
  /** Controls visibility. */
  visible: boolean;
  /** Called when the user taps outside or presses back. */
  onClose: () => void;
  /** Optional centered title rendered at the top of the modal. */
  title?: string;
  /** Estimated modal height — used for keyboard offset calculation. Defaults to 300. */
  estimatedHeight?: number;
  children: React.ReactNode;
}

export function ModalContainer({
  visible,
  onClose,
  title,
  estimatedHeight = 300,
  children,
}: ModalContainerProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const translateY = useRef(new Animated.Value(0)).current;

  // Keyboard show / hide animation
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

        const padding = 20;
        const modalBottom = screenHeight / 2 + estimatedHeight / 2;
        const targetBottom = screenHeight - keyboardHeight - padding;
        const moveAmount = modalBottom - targetBottom;

        if (moveAmount > 0) {
          Animated.timing(translateY, {
            toValue: -moveAmount,
            duration: Platform.OS === 'ios' ? Math.min(e.duration || 250, 250) : 200,
            useNativeDriver: true,
          }).start();
        }
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(translateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? Math.min(e.duration || 250, 250) : 200,
          useNativeDriver: true,
        }).start();
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [visible, translateY, estimatedHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.content, { backgroundColor }]}>
            {title != null && (
              <Typography variant="subtitle" style={styles.title}>
                {title}
              </Typography>
            )}
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  content: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
});
