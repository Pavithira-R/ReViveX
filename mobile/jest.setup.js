/* eslint-env jest */
// Official mock: SafeAreaProvider renders children with fixed insets under Jest.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));

// In-memory stand-in for the encrypted keychain. No biometric sensor by default;
// tests opt in with `require('react-native-keychain').getSupportedBiometryType.mockResolvedValue(...)`.
jest.mock('react-native-keychain', () => {
  const store = {};
  return {
    __store: store,
    ACCESS_CONTROL: { BIOMETRY_ANY: 'BiometryAny' },
    STORAGE_TYPE: { AES_GCM: 'KeystoreAESGCM', AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
    getSupportedBiometryType: jest.fn(async () => null),
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      store[options.service] = { username, password, service: options.service };
      return { service: options.service, storage: options.storage };
    }),
    getGenericPassword: jest.fn(async (options = {}) => store[options.service] ?? false),
    hasGenericPassword: jest.fn(async (options = {}) => options.service in store),
    resetGenericPassword: jest.fn(async (options = {}) => {
      delete store[options.service];
      return true;
    }),
  };
});
