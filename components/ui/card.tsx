/**
 * Card component
 * Theme-aware container with card background, optional border, and optional press handler.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type CardVariant = 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  /** `'outlined'` adds a 1px border (default). `'filled'` has no border. */
  variant?: CardVariant;
  /** If provided the card becomes pressable. */
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'outlined',
  onPress,
  disabled,
  style,
}: CardProps) {
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'cardBackground');

  const containerStyle: ViewStyle[] = [
    styles.base,
    { backgroundColor: cardBg },
  ];

  if (variant === 'outlined') {
    containerStyle.push({ borderWidth: 1, borderColor });
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[containerStyle, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
});
