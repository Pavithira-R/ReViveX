/**
 * Member 6 – Offline mode: saved copies shown without internet, opening the app
 * offline, and saved data deleted on logout.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

const { __fake } = require('../jest.firebase');

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

const notification = {
  userId: 'user-1',
  type: 'ECO',
  title: 'Eco points earned',
  message: '+30 points for recycling a device.',
  refId: 'r1',
  isRead: false,
  createdAt: '2026-11-15T10:00:00.000Z',
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

const act = (fn: () => void) => ReactTestRenderer.act(async () => fn());
const press = (root: ReactTestInstance, title: string) => act(() => button(root, title).props.onPress());

let renderer: ReactTestRenderer.ReactTestRenderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer.root;
};

const signIn = async (root: ReactTestInstance) => {
  await act(() => input(root, 'Email address').props.onChangeText(user.email));
  await act(() => input(root, 'Password').props.onChangeText('Password123'));
  await press(root, 'Sign In');
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
  __fake.setDoc('notifications/n1', notification);
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('without internet, Notifications shows the saved copy with an offline banner', async () => {
  const root = await renderApp();
  await signIn(root);

  // Online: loads and saves a copy.
  await press(root, 'Notifications');
  expect(allText(root)).toContain('Eco points earned');
  expect(allText(root)).not.toContain("You're offline");
  await press(root, '‹ Back');

  // Offline: the saved copy is shown.
  __fake.setOffline(true);
  await press(root, 'Notifications');
  expect(allText(root)).toContain('Eco points earned');
  expect(allText(root)).toContain("You're offline");
});

test('opening the app without internet keeps the user signed in with saved data', async () => {
  const first = await renderApp();
  await signIn(first);
  await ReactTestRenderer.act(async () => renderer.unmount());

  // App restarts with no connection: loading the profile from Firestore fails.
  __fake.setOffline(true);
  const root = await renderApp();

  expect(allText(root)).toMatch(/Hello,\s+Nimal/);
});

test('logging out deletes the saved copies', async () => {
  const root = await renderApp();
  await signIn(root);
  await press(root, 'Notifications');
  await press(root, '‹ Back');

  await press(root, 'My Profile');
  await press(root, 'Log Out');

  // Sign in again, then go offline: nothing saved any more → normal error.
  await signIn(root);
  __fake.setOffline(true);
  await press(root, 'Notifications');

  expect(allText(root)).not.toContain('Eco points earned');
  expect(allText(root)).toContain('Cannot reach the server');
});

test('without a saved profile, opening the app offline shows the login screen', async () => {
  // Signed in to Firebase earlier, but no profile copy saved on this phone.
  await require('firebase/auth').signInWithEmailAndPassword(null, user.email, 'Password123');
  __fake.setOffline(true);

  const root = await renderApp();

  expect(allText(root)).toContain('Welcome back');
});
