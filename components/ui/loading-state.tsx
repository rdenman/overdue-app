/**
 * LoadingState component
 * Centered activity indicator with an optional message.
 */

import { useThemeColor } from '@/lib/hooks/use-theme-color';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Typography } from './typography';

export interface LoadingStateProps {
  /** Text shown beneath the spinner. Defaults to `"Loading…"`. */
  message?: string;
  /** Spinner size. Defaults to `'large'`. */
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({
  message = 'Loading…',
  size = 'large',
  style,
}: LoadingStateProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={tintColor} />
      {message ? (
        <Typography muted style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
  },
});
