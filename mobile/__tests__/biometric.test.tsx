/**
 * Member 1 – Saved session (Firebase keeps it) and fingerprint login,
 * with the keychain stand-in from jest.setup.js and the fake Firebase.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Switch, Text } from 'react-native';
import * as Keychain from 'react-native-keychain';
import App from '../App';

const { __fake } = require('../jest.firebase');

const keychain = Keychain as unknown as {
  __store: Record<string, { password: string }>;
  getSupportedBiometryType: jest.Mock;
  getGenericPassword: jest.Mock;
};

const user = {
  id: 'user-1',
  name: 'Nimal Perera',
  email: 'nimal@example.com',
  role: 'ITEM_OWNER',
  phone: null,
  profileImage: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const allText = (root: ReactTestInstance): string =>
  root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .flat(Infinity)
    .filter((child) => typeof child === 'string')
    .join(' ');

const input = (root: ReactTestInstance, label: string) =>
  root.findAll((node) => node.props.accessibilityLabel === label && !!node.props.onChangeText)[0];

const button = (root: ReactTestInstance, title: string) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      (allText(node) === title || node.props.accessibilityLabel === title)
  )[0];

const renderApp = async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer;
};

const press = async (root: ReactTestInstance, title: string) => {
  await ReactTestRenderer.act(async () => {
    button(root, title).props.onPress();
  });
};

const signIn = async (root: ReactTestInstance) => {
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await press(root, 'Sign In');
};

const toggleFingerprint = async (root: ReactTestInstance, on: boolean) => {
  await ReactTestRenderer.act(async () => {
    root.findByType(Switch).props.onValueChange(on);
  });
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
});

test('stays signed in after the app restarts', async () => {
  const first = await renderApp();
  await signIn(first.root);
  await ReactTestRenderer.act(async () => {
    first.unmount();
  });

  const second = await renderApp();

  expect(allText(second.root)).toMatch(/Hello,\s+Nimal/);
});

test('an account deactivated while signed in is signed out at the next start', async () => {
  const first = await renderApp();
  await signIn(first.root);
  await ReactTestRenderer.act(async () => {
    first.unmount();
  });
  __fake.setDoc('users/user-1', { ...user, isActive: false });

  const second = await renderApp();

  expect(allText(second.root)).toContain('Welcome back');
  expect(__fake.currentUser()).toBeNull();
});

test('without a fingerprint sensor the option is disabled and explained', async () => {
  const app = await renderApp();
  await signIn(app.root);
  await press(app.root, 'My Profile');

  expect(allText(app.root)).toContain('Not available on this phone');
  expect(app.root.findByType(Switch).props.disabled).toBe(true);
});

test('fingerprint login after logging out', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  const app = await renderApp();
  await signIn(app.root);
  await press(app.root, 'My Profile');

  await toggleFingerprint(app.root, true);
  expect(allText(app.root)).toContain('Fingerprint login turned on.');
  expect(JSON.parse(keychain.__store['revivex.biometric'].password)).toEqual({
    email: user.email,
    password: 'Password123',
  });

  await press(app.root, 'Log Out');
  expect(allText(app.root)).toContain('Welcome back');

  await press(app.root, 'Log in with fingerprint');

  expect(allText(app.root)).toMatch(/Hello,\s+Nimal/);
  expect(__fake.currentUser().uid).toBe('user-1');
});

test('after a restart, fingerprint can only be turned on after a password sign-in', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  const first = await renderApp();
  await signIn(first.root);
  await ReactTestRenderer.act(async () => {
    first.unmount();
  });

  const app = await renderApp();
  await press(app.root, 'My Profile');
  await toggleFingerprint(app.root, true);

  expect(allText(app.root)).toContain('sign in with your password once');
  expect(keychain.__store['revivex.biometric']).toBeUndefined();
});

test('a changed password makes the saved fingerprint login expire', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  keychain.__store['revivex.biometric'] = {
    password: JSON.stringify({ email: user.email, password: 'OldPassword1' }),
  };
  const app = await renderApp();

  await press(app.root, 'Log in with fingerprint');

  expect(allText(app.root)).toContain('Fingerprint login has expired');
  expect(keychain.__store['revivex.biometric']).toBeUndefined();
});

test('a cancelled fingerprint scan keeps the password form', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  keychain.__store['revivex.biometric'] = {
    password: JSON.stringify({ email: user.email, password: 'Password123' }),
  };
  const app = await renderApp();

  keychain.getGenericPassword.mockResolvedValueOnce(false); // user tapped "Use password"
  await press(app.root, 'Log in with fingerprint');

  expect(allText(app.root)).toContain('Fingerprint not confirmed');
  expect(allText(app.root)).toContain('Welcome back');
  expect(__fake.currentUser()).toBeNull();
});
