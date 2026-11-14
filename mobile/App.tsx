import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components';
import { AuthProvider } from './src/context';
import { AppNavigator } from './src/navigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
