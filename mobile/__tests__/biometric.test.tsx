/**
 * Saved session + fingerprint login, with the keychain stand-in from jest.setup.js.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Switch, Text } from 'react-native';
import * as Keychain from 'react-native-keychain';
import App from '../App';

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

const ok = (data: unknown) => ({ success: true, message: 'OK', data, error: null });

const mockFetchResponse = (status: number, body: unknown) =>
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

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
  mockFetchResponse(200, ok({ token: 'jwt-token-123', user }));
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await press(root, 'Sign In');
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

test('stays signed in after the app restarts', async () => {
  const first = await renderApp();
  await signIn(first.root);
  expect(keychain.__store['revivex.session'].password).toBe('jwt-token-123');
  await ReactTestRenderer.act(async () => {
    first.unmount();
  });

  mockFetchResponse(200, ok(user)); // GET /users/me with the saved token
  const second = await renderApp();

  const [meUrl, meInit] = (globalThis.fetch as jest.Mock).mock.calls[1];
  expect(meUrl).toMatch(/\/users\/me$/);
  expect(meInit.headers.Authorization).toBe('Bearer jwt-token-123');
  expect(allText(second.root)).toMatch(/Hello,\s+Nimal/);
});

test('an expired saved session shows the login screen and is cleared', async () => {
  keychain.__store['revivex.session'] = { password: 'old-token' };
  mockFetchResponse(401, {
    success: false,
    message: 'Authentication token has expired',
    data: null,
    error: { code: 'UNAUTHORIZED', details: [] },
  });

  const app = await renderApp();

  expect(allText(app.root)).toContain('Welcome back');
  expect(keychain.__store['revivex.session']).toBeUndefined();
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

  await ReactTestRenderer.act(async () => {
    app.root.findByType(Switch).props.onValueChange(true);
  });
  expect(allText(app.root)).toContain('Fingerprint login turned on.');

  mockFetchResponse(200, ok(null)); // POST /auth/logout
  await press(app.root, 'Log Out');
  expect(allText(app.root)).toContain('Welcome back');

  mockFetchResponse(200, ok(user)); // GET /users/me with the fingerprint-protected token
  await press(app.root, 'Log in with fingerprint');

  expect(allText(app.root)).toMatch(/Hello,\s+Nimal/);
});

test('a cancelled fingerprint scan keeps the password form', async () => {
  keychain.getSupportedBiometryType.mockResolvedValue('Fingerprint');
  keychain.__store['revivex.biometric'] = { password: 'jwt-token-123' };
  const app = await renderApp();

  keychain.getGenericPassword.mockResolvedValueOnce(false); // user tapped "Use password"
  await press(app.root, 'Log in with fingerprint');

  expect(allText(app.root)).toContain('Fingerprint not confirmed');
  expect(allText(app.root)).toContain('Welcome back');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
