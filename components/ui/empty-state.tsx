/**
 * EmptyState component
 * Centered placeholder shown when a list or section has no content.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, type ButtonProps } from './button';
import { Typography } from './typography';

export interface EmptyStateProps {
  /** Primary heading. */
  title: string;
  /** Supporting description. */
  message: string;
  /** Optional call-to-action button. */
  action?: Pick<ButtonProps, 'title' | 'onPress'>;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title, message, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="subtitle" style={styles.title}>
        {title}
      </Typography>
      <Typography muted style={styles.message}>
        {message}
      </Typography>
      {action && (
        <Button
          title={action.title}
          onPress={action.onPress}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
  },
  action: {
    marginTop: 20,
  },
});
