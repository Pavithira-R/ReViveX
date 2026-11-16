/**
 * Member 6 – Notifications screen on the fake Firestore (`notifications` collection).
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
      (allText(node).includes(title) || node.props.accessibilityLabel === title)
  )[0];

const press = async (root: ReactTestInstance, title: string) => {
  await ReactTestRenderer.act(async () => {
    button(root, title).props.onPress();
  });
};

let renderer: ReactTestRenderer.ReactTestRenderer;

/** Signs in, then opens Notifications (optionally without a connection). */
const openNotifications = async (offline = false) => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await press(root, 'Sign In');

  __fake.setOffline(offline);
  await press(root, 'Notifications');
  return root;
};

const seedNotifications = () => {
  __fake.setDoc('notifications/n2', {
    userId: 'user-1',
    type: 'ECO',
    title: 'Eco points earned',
    message: '+30 points for recycling a device.',
    refId: 'r1',
    isRead: false,
    createdAt: '2026-11-14T10:00:00.000Z',
  });
  __fake.setDoc('notifications/n1', {
    userId: 'user-1',
    type: 'REPAIR',
    title: 'Repair completed',
    message: 'Your laptop is ready for pickup.',
    refId: 'p1',
    isRead: true,
    createdAt: '2026-11-13T10:00:00.000Z',
  });
  // Someone else's notification must never show up.
  __fake.setDoc('notifications/n3', {
    userId: 'someone-else',
    type: 'GENERAL',
    title: 'Not for Nimal',
    message: 'Private',
    refId: null,
    isRead: false,
    createdAt: '2026-11-14T11:00:00.000Z',
  });
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('lists my notifications and marks one as read when tapped', async () => {
  seedNotifications();
  const root = await openNotifications();

  expect(allText(root)).toContain('Eco points earned');
  expect(allText(root)).toContain('Repair completed');
  expect(allText(root)).not.toContain('Not for Nimal');
  expect(allText(root)).toContain('Mark all as read (1)');

  await press(root, 'Eco points earned');

  expect(__fake.getDoc('notifications/n2').isRead).toBe(true);
  expect(allText(root)).not.toContain('Mark all as read');
});

test('marks all notifications as read', async () => {
  seedNotifications();
  const root = await openNotifications();

  await press(root, 'Mark all as read');

  expect(__fake.getDoc('notifications/n2').isRead).toBe(true);
  expect(__fake.getDoc('notifications/n3').isRead).toBe(false); // someone else's stays unread
  expect(allText(root)).not.toContain('Mark all as read');
});

test('shows an empty message when there are no notifications', async () => {
  const root = await openNotifications();

  expect(allText(root)).toContain('No notifications yet');
});

test('shows an error with a retry button when offline', async () => {
  const root = await openNotifications(true);

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
