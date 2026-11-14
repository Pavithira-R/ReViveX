/* eslint-env jest */
// Each test starts signed out, with nothing saved in the keychain stand-in.
beforeEach(() => {
  const keychain = require('react-native-keychain');
  Object.keys(keychain.__store).forEach((key) => delete keychain.__store[key]);
  keychain.getSupportedBiometryType.mockResolvedValue(null);
});
