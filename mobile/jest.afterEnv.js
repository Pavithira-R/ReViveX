/* eslint-env jest */
// Each test starts signed out, with nothing saved in the keychain stand-in.
beforeEach(() => {
  const keychain = require('react-native-keychain');
  Object.keys(keychain.__store).forEach((key) => delete keychain.__store[key]);
  keychain.getSupportedBiometryType.mockResolvedValue(null);
});

// Each test starts with no offline copies saved.
beforeEach(async () => {
  await require('@react-native-async-storage/async-storage').default.clear();
});

// Each test starts with no Firebase accounts, documents or signed-in user, and online.
beforeEach(() => {
  require('./jest.firebase').__fake.reset();
});
