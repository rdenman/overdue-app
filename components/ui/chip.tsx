/**
 * Shared Chip component
 * Supports selectable (pressable) and static (badge) use cases.
 * When `selected` the chip fills with color; otherwise it shows as outlined.
 * If `onPress` is provided the chip is pressable; otherwise it renders as a View.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type ChipColor = 'primary' | 'danger' | 'success';
type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: ChipColor;
  size?: ChipSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG: Record<
  ChipSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    fontWeight: TextStyle['fontWeight'];
    borderRadius: number;
  }
> = {
  sm: { paddingVertical: 3, paddingHorizontal: 8, fontSize: 11, fontWeight: '600', borderRadius: 10 },
  md: { paddingVertical: 7, paddingHorizontal: 14, fontSize: 14, fontWeight: '500', borderRadius: 20 },
};

export function Chip({
  label,
  selected = false,
  onPress,
  color = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}: ChipProps) {
  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');
  const borderThemeColor = useThemeColor({}, 'border');
  const textThemeColor = useThemeColor({}, 'text');

  // Resolve semantic color (same mapping as Button)
  const colorMap: Record<ChipColor, string> = {
    primary: tintColor,
    danger: errorColor,
    success: successColor,
  };
  const resolvedColor = colorMap[color];

  // Contrast text for filled / selected chips
  const filledTextColor =
    color === 'danger' ? '#fff' : colorScheme === 'dark' ? '#000' : '#fff';

  const sizeStyles = SIZE_CONFIG[size];

  // Build container styles
  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
    },
  ];

  let resolvedTextColor: string;

  if (selected) {
    containerStyle.push({
      backgroundColor: resolvedColor,
      borderColor: resolvedColor,
      borderWidth: 1,
    });
    resolvedTextColor = filledTextColor;
  } else {
    containerStyle.push({
      borderWidth: 1,
      borderColor: borderThemeColor,
      backgroundColor: 'transparent',
    });
    resolvedTextColor = textThemeColor;
  }

  if (disabled) {
    containerStyle.push(styles.disabled);
  }

  const content = (
    <Text
      style={[
        { fontSize: sizeStyles.fontSize, fontWeight: sizeStyles.fontWeight, color: resolvedTextColor },
        textStyle,
      ]}
    >
      {label}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        style={[containerStyle, style]}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
