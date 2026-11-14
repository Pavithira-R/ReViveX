module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./jest.afterEnv.js'],
  // The first (cold) run compiles the whole app and can exceed Jest's 5s default.
  testTimeout: 30000,
};
