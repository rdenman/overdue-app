/**
 * Shared Button component
 * Supports filled, outlined, and ghost variants with primary, danger, and success colors.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type ButtonVariant = 'filled' | 'outlined' | 'ghost';
type ButtonColor = 'primary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; minHeight: number }> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13, minHeight: 32 },
  md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 15, minHeight: 40 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16, minHeight: 48 },
};

export function Button({
  title,
  onPress,
  variant = 'filled',
  color = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');
  const borderThemeColor = useThemeColor({}, 'border');
  const contrastTextColor = useThemeColor({ light: '#fff', dark: '#000' }, 'text');

  // Resolve the semantic color to an actual value
  const colorMap: Record<ButtonColor, string> = {
    primary: tintColor,
    danger: errorColor,
    success: successColor,
  };
  const resolvedColor = colorMap[color];

  // Contrast text for filled buttons
  const filledTextColor = color === 'danger' ? '#fff' : contrastTextColor;

  // Build container styles per variant
  const sizeStyles = SIZE_CONFIG[size];

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      minHeight: sizeStyles.minHeight,
    },
  ];

  let resolvedTextColor: string;

  switch (variant) {
    case 'filled':
      containerStyle.push({ backgroundColor: resolvedColor });
      resolvedTextColor = filledTextColor;
      break;
    case 'outlined':
      containerStyle.push({
        borderWidth: 1,
        borderColor: resolvedColor,
        backgroundColor: 'transparent',
      });
      resolvedTextColor = resolvedColor;
      break;
    case 'ghost':
      containerStyle.push({ backgroundColor: 'transparent' });
      resolvedTextColor = resolvedColor;
      break;
  }

  if (disabled || loading) {
    containerStyle.push(styles.disabled);
  }

  return (
    <Pressable
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={resolvedTextColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyles.fontSize, color: resolvedTextColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
