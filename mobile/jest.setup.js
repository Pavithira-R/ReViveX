/* eslint-env jest */
// Official mock: SafeAreaProvider renders children with fixed insets under Jest.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
