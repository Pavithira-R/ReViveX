/**
 * Member 1 – Change password from the profile (re-authenticates with the current password)
 * and its effect on fingerprint login.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Switch, Text } from 'react-native';
import * as Keychain from 'react-native-keychain';
import App from '../App';
import { authService } from '../src/services';

const { __fake } = require('../jest.firebase');

const keychain = Keychain as unknown as {
  __store: Record<string, { password: string }>;
  getSupportedBiometryType: jest.Mock;
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
      allText(node) === title
  )[0];

const act = (fn: () => void) => ReactTestRenderer.act(async () => fn());
const press = (root: ReactTestInstance, title: string) => act(() => button(root, title).props.onPress());
const type = (root: ReactTestInstance, label: string, value: string) =>
  act(() => input(root, label).props.onChangeText(value));

let renderer: ReactTestRenderer.ReactTestRenderer;

/** Signs in with the password and opens Profile → Change password. */
const openChangePassword = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;
  await type(root, 'Email address', user.email);
  await type(root, 'Password', 'Password123');
  await press(root, 'Sign In');
  await press(root, 'My Profile');
  return root;
};

const fillForm = async (root: ReactTestInstance, current: string, next: string, confirm = next) => {
  await press(root, 'Change password');
  await type(root, 'Current password', current);
  await type(root, 'New password', next);
  await type(root, 'Confirm new password', confirm);
  await press(root, 'Change Password');
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('changes the password; the new one works and the old one does not', async () => {
  const root = await openChangePassword();
  await fillForm(root, 'Password123', 'NewSecret456');

  expect(allText(root)).toContain('Password changed.');
  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
  await authService.logout();
  await expect(authService.login({ email: user.email, password: 'Password123' })).rejects.toMatchObject({
    message: 'Invalid email or password',
  });
  await expect(authService.login({ email: user.email, password: 'NewSecret456' })).resolves.toBeTruthy();
});

test('a wrong current password is refused', async () => {
  const root = await openChangePassword();
  await fillForm(root, 'WrongPass1', 'NewSecret456');

  expect(allText(root)).toContain('Current password is incorrect');
});

test('mismatched or weak new passwords are refused before calling Firebase', async () => {
  const root = await openChangePassword();
  await fillForm(root, 'Password123', 'NewSecret456', 'NewSecret789');
  expect(allText(root)).toContain('The new passwords do not match.');

  await type(root, 'New password', 'short');
  await type(root, 'Confirm new password', 'short');
  await press(root, 'Change Password');
  expect(allText(root)).toContain('New password must be at least 8 characters');
});

test('fingerprint login is turned off, then can be turned on again with the new password', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  const root = await openChangePassword();
  await act(() => root.findByType(Switch).props.onValueChange(true));
  expect(JSON.parse(keychain.__store['revivex.biometric'].password).password).toBe('Password123');

  await fillForm(root, 'Password123', 'NewSecret456');

  expect(allText(root)).toContain('Fingerprint login was turned off');
  expect(keychain.__store['revivex.biometric']).toBeUndefined();

  await act(() => root.findByType(Switch).props.onValueChange(true));
  expect(JSON.parse(keychain.__store['revivex.biometric'].password)).toEqual({
    email: user.email,
    password: 'NewSecret456',
  });
});
