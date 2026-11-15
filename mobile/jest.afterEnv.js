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
