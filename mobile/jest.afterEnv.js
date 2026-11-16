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

// Confirmation pop-ups (e.g. "Log out of ReViveX?"): tests tap the confirming button
// (the destructive one, else the last one), as a user would.
beforeEach(() => {
  const { Alert } = require('react-native');
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    const confirm = buttons?.find((b) => b.style === 'destructive') ?? buttons?.[buttons.length - 1];
    confirm?.onPress?.();
  });
});
