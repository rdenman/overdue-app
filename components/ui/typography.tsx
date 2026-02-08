/**
 * Typography component
 * Shared text primitive with theme-aware colors, semantic variants, and utility props.
 * Replaces ThemedText across the entire app.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React from 'react';
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

/**
 * Variant presets — each maps to a fixed set of font-size / weight / line-height values.
 *
 * Mapping from old ThemedText types → new Typography variants:
 *   default        → body
 *   defaultSemiBold → bodySemiBold
 *   title          → title
 *   subtitle       → subtitle
 *   link           → link
 */
export type TypographyVariant =
  | 'body'
  | 'bodySemiBold'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'sectionTitle'
  | 'title'
  | 'subtitle'
  | 'link';

/** Semantic color tokens resolved from the theme. */
export type TypographyColor = 'default' | 'primary' | 'error' | 'success' | 'muted';

export interface TypographyProps extends TextProps {
  /** Visual preset — controls font size, weight, and line height. Defaults to `'body'`. */
  variant?: TypographyVariant;
  /** Semantic color token. Overrides the default theme text color. */
  color?: TypographyColor;
  /** Short-hand for `color="muted"` — applies reduced opacity. */
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}

const VARIANT_STYLES: Record<TypographyVariant, TextStyle> = {
  body: { fontSize: 16, lineHeight: 24 },
  bodySemiBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  title: { fontSize: 32, lineHeight: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 20, fontWeight: 'bold' },
  link: { fontSize: 16, lineHeight: 30 },
};

export function Typography({
  variant = 'body',
  color: colorProp,
  muted = false,
  style,
  ...rest
}: TypographyProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  // Resolve semantic color to actual value
  const resolvedMuted = muted || colorProp === 'muted';

  let resolvedColor: string;
  switch (colorProp) {
    case 'primary':
      resolvedColor = tintColor;
      break;
    case 'error':
      resolvedColor = errorColor;
      break;
    case 'success':
      resolvedColor = successColor;
      break;
    default:
      // 'default', 'muted', or undefined — all use the theme text color
      resolvedColor = textColor;
      break;
  }

  // For the link variant, default to primary color unless explicitly overridden
  if (variant === 'link' && colorProp === undefined) {
    resolvedColor = tintColor;
  }

  return (
    <Text
      style={[
        VARIANT_STYLES[variant],
        { color: resolvedColor },
        resolvedMuted && styles.muted,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  muted: {
    opacity: 0.7,
  },
});
