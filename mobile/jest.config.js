module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./jest.afterEnv.js'],
  // The first (cold) run compiles the whole app and can exceed Jest's 5s default.
  testTimeout: 30000,
  moduleNameMapper: {
    // Mock vector-icons so Jest doesn't try to load the native font module.
    'react-native-vector-icons/(.*)': '<rootDir>/__mocks__/react-native-vector-icons.js',
  },
};
