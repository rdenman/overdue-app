/**
 * ErrorBoundary - Catches React errors and prevents app crashes
 * Displays a fallback UI when an error occurs
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './themed-view';
import { Typography } from './ui/typography';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Future: Send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container}>
          <Typography variant="title" style={styles.title}>
            Something went wrong
          </Typography>
          <Typography style={styles.message}>
            We&apos;re sorry, but something unexpected happened. Please restart the app.
          </Typography>
          {__DEV__ && this.state.error && (
            <Typography variant="caption" muted style={styles.errorDetails}>
              {this.state.error.toString()}
            </Typography>
          )}
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorDetails: {
    marginTop: 20,
    textAlign: 'center',
  },
});
