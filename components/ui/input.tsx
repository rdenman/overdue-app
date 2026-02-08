/**
 * Input component
 * Theme-aware TextInput with optional label and error message.
 * Supports single-line and multiline (textarea) modes.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React, { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Typography } from './typography';

export interface InputProps extends TextInputProps {
  /** Optional label rendered above the input. */
  label?: string;
  /** Error message rendered below the input in red. */
  error?: string;
  /** Container style wrapper (label + input + error). */
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerStyle, style, multiline, ...rest },
  ref,
) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const inputBg = useThemeColor({}, 'cardBackground');
  const placeholderColor = useThemeColor({}, 'icon'); // subtle grey

  return (
    <View style={containerStyle}>
      {label != null && (
        <Typography variant="label" style={styles.label}>
          {label}
        </Typography>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderColor}
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor,
            color: textColor,
          },
          multiline && styles.multiline,
          style,
        ]}
        multiline={multiline}
        {...rest}
      />
      {error != null && (
        <Typography variant="caption" color="error" style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 4,
  },
});
