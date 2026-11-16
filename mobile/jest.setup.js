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

// Stand-in for the shake detector. Tests "shake the phone" with
// `require('react-native-shake').__shake()`.
jest.mock('react-native-shake', () => {
  const listeners = new Set();
  return {
    __esModule: true,
    default: {
      addListener: (callback) => {
        listeners.add(callback);
        return { remove: () => listeners.delete(callback) };
      },
      removeAllListeners: () => listeners.clear(),
      configure: () => undefined,
    },
    __shake: () => listeners.forEach((callback) => callback()),
  };
});

// In-memory stand-in for AsyncStorage (offline copies). Cleared before every test.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const storage = {
    getItem: async (key) => (store.has(key) ? store.get(key) : null),
    setItem: async (key, value) => {
      store.set(key, value);
    },
    removeItem: async (key) => {
      store.delete(key);
    },
    getAllKeys: async () => Array.from(store.keys()),
    removeMany: async (keys) => keys.forEach((key) => store.delete(key)),
    clear: async () => store.clear(),
  };
  return { __esModule: true, default: storage };
});

// In-memory Firebase (Auth + Firestore). See jest.firebase.js for the test helpers.
jest.mock('firebase/app', () => require('./jest.firebase').app);
jest.mock('firebase/auth', () => require('./jest.firebase').auth);
jest.mock('firebase/firestore', () => require('./jest.firebase').firestore);

// Icon font stand-in handled by moduleNameMapper in jest.config.js → __mocks__/react-native-vector-icons.js
