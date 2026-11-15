/**
 * Member 1 – Shake to report a problem, the Profile fallback and the admin reports screen.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

const { __shake } = require('react-native-shake') as { __shake: () => void };

const makeUser = (role: string) => ({
  id: `user-${role}`,
  name: role === 'ADMIN' ? 'Admin User' : 'Nimal Perera',
  email: `${role.toLowerCase()}@example.com`,
  role,
  phone: null,
  profileImage: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

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

const act = (fn: () => void) => ReactTestRenderer.act(async () => fn());
const press = (root: ReactTestInstance, title: string) => act(() => button(root, title).props.onPress());

const lastCall = () => {
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const [url, init] = calls[calls.length - 1];
  return { url: url as string, method: init.method as string, body: init.body && JSON.parse(init.body) };
};

let renderer: ReactTestRenderer.ReactTestRenderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer.root;
};

const signIn = async (root: ReactTestInstance, role = 'ITEM_OWNER') => {
  mockFetchResponse(200, ok({ token: 'jwt-token-123', user: makeUser(role) }));
  await act(() => input(root, 'Email address').props.onChangeText(`${role.toLowerCase()}@example.com`));
  await act(() => input(root, 'Password').props.onChangeText('Password123'));
  await press(root, 'Sign In');
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('shaking the phone opens "Report a problem" and sends it with the current screen', async () => {
  const root = await renderApp();
  await signIn(root);

  await act(() => __shake());
  expect(allText(root)).toContain('Report a problem');
  expect(allText(root)).toContain('On screen: Home.');

  await act(() => input(root, 'What happened?').props.onChangeText('The photo did not upload'));
  mockFetchResponse(201, ok({ id: 'r1' }));
  await press(root, 'Send report');

  expect(lastCall()).toEqual({
    url: expect.stringMatching(/\/reports$/),
    method: 'POST',
    body: { message: 'The photo did not upload', screen: 'Home' },
  });
  expect(allText(root)).toContain('Thanks! Your report was sent to the team.');
});

test('a too-short description is rejected without calling the server', async () => {
  const root = await renderApp();
  await signIn(root);
  await act(() => __shake());
  const callsBefore = (globalThis.fetch as jest.Mock).mock.calls.length;

  await act(() => input(root, 'What happened?').props.onChangeText('bad'));
  await press(root, 'Send report');

  expect(allText(root)).toContain('at least 5 characters');
  expect((globalThis.fetch as jest.Mock).mock.calls.length).toBe(callsBefore);
});

test('shaking on the login screen does nothing', async () => {
  const root = await renderApp();

  await act(() => __shake());

  expect(allText(root)).not.toContain('Report a problem');
});

test('the Profile button opens the same report sheet (fallback without a sensor)', async () => {
  const root = await renderApp();
  await signIn(root);
  await press(root, 'My Profile');

  await press(root, 'Report a problem');

  expect(allText(root)).toContain('On screen: Profile.');
  expect(allText(root)).toContain('What happened?');
});

test('admins can see open reports and mark them resolved', async () => {
  const root = await renderApp();
  await signIn(root, 'ADMIN');

  mockFetchResponse(
    200,
    ok([
      {
        id: 'r1',
        screen: 'PostItem',
        message: 'The photo did not upload',
        status: 'OPEN',
        reporter: { id: 'user-ITEM_OWNER', name: 'Nimal Perera', email: 'item_owner@example.com' },
        resolvedAt: null,
        createdAt: '2026-11-15T09:00:00.000Z',
      },
    ])
  );
  await press(root, 'Problem Reports');
  expect(lastCall()).toMatchObject({ url: expect.stringMatching(/\/admin\/reports\?status=OPEN$/), method: 'GET' });
  expect(allText(root)).toContain('The photo did not upload');

  mockFetchResponse(200, ok({ id: 'r1', status: 'RESOLVED' }));
  await press(root, 'Mark as resolved');

  expect(lastCall()).toMatchObject({ url: expect.stringMatching(/\/admin\/reports\/r1\/resolve$/), method: 'PATCH' });
  expect(allText(root)).not.toContain('The photo did not upload');
});

test('a missing shake module never crashes: subscribing just does nothing', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native-shake', () => {
      throw new Error("The package 'react-native-shake' doesn't seem to be linked.");
    });
    const { subscribeToShake } = require('../src/services/shake');
    const unsubscribe = subscribeToShake(() => undefined);
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});
