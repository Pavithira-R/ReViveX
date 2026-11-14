/**
 * Member 1 mobile auth flow (TC-AUTH-05/06, TC-UI-03) with a mocked backend.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

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
  return renderer.root;
};

const signIn = async (root: ReactTestInstance, email: string, password: string) => {
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(email);
    input(root, 'Password').props.onChangeText(password);
  });
  await ReactTestRenderer.act(async () => {
    button(root, 'Sign In').props.onPress();
  });
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

test('shows a validation message for an invalid email without calling the API', async () => {
  const root = await renderApp();
  await signIn(root, 'not-an-email', 'Password123');

  expect(allText(root)).toContain('Please enter a valid email address.');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

test('shows the server error when credentials are wrong', async () => {
  mockFetchResponse(401, {
    success: false,
    message: 'Invalid email or password',
    data: null,
    error: { code: 'INVALID_CREDENTIALS', details: [] },
  });

  const root = await renderApp();
  await signIn(root, 'nimal@example.com', 'WrongPass1');

  expect(allText(root)).toContain('Invalid email or password');
  expect(allText(root)).toContain('Welcome back');
});

test('signs in, opens the home screen and sends the token on later requests', async () => {
  mockFetchResponse(200, {
    success: true,
    message: 'Login successful',
    data: { token: 'jwt-token-123', user },
    error: null,
  });

  const root = await renderApp();
  await signIn(root, 'nimal@example.com', 'Password123');

  const [loginUrl, loginInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
  expect(loginUrl).toMatch(/\/auth\/login$/);
  expect(JSON.parse(loginInit.body)).toEqual({ email: 'nimal@example.com', password: 'Password123' });
  expect(allText(root)).toMatch(/Hello,\s+Nimal/);

  // Log out from the profile screen; the logout call must carry the bearer token.
  mockFetchResponse(200, { success: true, message: 'Logout successful', data: null, error: null });
  await ReactTestRenderer.act(async () => {
    button(root, 'My Profile').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    button(root, 'Log Out').props.onPress();
  });

  const [, logoutInit] = (globalThis.fetch as jest.Mock).mock.calls[1];
  expect(logoutInit.headers.Authorization).toBe('Bearer jwt-token-123');
  expect(allText(root)).toContain('Welcome back');
});
