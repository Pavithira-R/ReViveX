import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { PrimaryButton } from './PrimaryButton';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last line of defence: an unexpected error in any screen shows this message
 * instead of closing the app. "Try again" re-renders the screens.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Shows in Logcat (tag ReactNativeJS) for debugging.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} accessibilityRole="alert">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          This screen hit an unexpected problem. Your data is safe. Please try again.
        </Text>
        <PrimaryButton title="Try again" onPress={this.handleRetry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  body: { fontSize: 15, color: COLORS.textMuted, lineHeight: 22, marginBottom: 16 },
});
