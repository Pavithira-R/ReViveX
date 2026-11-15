/**
 * Member 1 – Shake to report a problem, the Profile fallback and the admin reports screen
 * (reports are saved in the Firestore `problemReports` collection; fake Firebase in tests).
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

const { __fake } = require('../jest.firebase');
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

let renderer: ReactTestRenderer.ReactTestRenderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer.root;
};

const signIn = async (root: ReactTestInstance, role = 'ITEM_OWNER') => {
  __fake.addAccount(makeUser(role), 'Password123');
  await act(() => input(root, 'Email address').props.onChangeText(`${role.toLowerCase()}@example.com`));
  await act(() => input(root, 'Password').props.onChangeText('Password123'));
  await press(root, 'Sign In');
};

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('shaking the phone opens "Report a problem" and saves it with the current screen', async () => {
  const root = await renderApp();
  await signIn(root);

  await act(() => __shake());
  expect(allText(root)).toContain('Report a problem');
  expect(allText(root)).toContain('On screen: Home.');

  await act(() => input(root, 'What happened?').props.onChangeText('The photo did not upload'));
  await press(root, 'Send report');

  expect(__fake.docsIn('problemReports')).toEqual([
    expect.objectContaining({
      userId: 'user-ITEM_OWNER',
      message: 'The photo did not upload',
      screen: 'Home',
      status: 'OPEN',
      reporter: { id: 'user-ITEM_OWNER', name: 'Nimal Perera', email: 'item_owner@example.com' },
    }),
  ]);
  expect(allText(root)).toContain('Thanks! Your report was sent to the team.');
});

test('a too-short description is rejected without saving anything', async () => {
  const root = await renderApp();
  await signIn(root);
  await act(() => __shake());

  await act(() => input(root, 'What happened?').props.onChangeText('bad'));
  await press(root, 'Send report');

  expect(allText(root)).toContain('at least 5 characters');
  expect(__fake.docsIn('problemReports')).toEqual([]);
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
  const report = {
    userId: 'user-ITEM_OWNER',
    screen: 'PostItem',
    message: 'The photo did not upload',
    status: 'OPEN',
    reporter: { id: 'user-ITEM_OWNER', name: 'Nimal Perera', email: 'item_owner@example.com' },
    resolvedAt: null,
    createdAt: '2026-11-15T09:00:00.000Z',
  };
  __fake.setDoc('problemReports/r1', report);
  __fake.setDoc('problemReports/r2', { ...report, message: 'Already fixed', status: 'RESOLVED' });

  const root = await renderApp();
  await signIn(root, 'ADMIN');
  await press(root, 'Problem Reports');

  expect(allText(root)).toContain('The photo did not upload');
  expect(allText(root)).not.toContain('Already fixed');

  await press(root, 'Mark as resolved');

  expect(__fake.getDoc('problemReports/r1')).toMatchObject({ status: 'RESOLVED', resolvedAt: expect.any(String) });
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
