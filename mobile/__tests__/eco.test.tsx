/**
 * Member 6 – My Eco Impact screen on the fake Firestore (`ecoActions` collection).
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
    .filter((child) => typeof child === 'string' || typeof child === 'number')
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

let renderer: ReactTestRenderer.ReactTestRenderer;

/** Signs in, then opens My Eco Impact. `beforeOpen` can e.g. take the connection away. */
const openEcoImpact = async (beforeOpen: () => void = () => undefined) => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await ReactTestRenderer.act(async () => {
    button(root, 'Sign In').props.onPress();
  });
  beforeOpen();
  await ReactTestRenderer.act(async () => {
    button(root, 'My Eco Impact').props.onPress();
  });
  return root;
};

const action = (userId: string, type: string, refId: string, category: string, points: number, co2: number, ewaste: number, day: string) =>
  __fake.setDoc(`ecoActions/${type}_${refId}`, {
    userId,
    type,
    points,
    refId,
    deviceCategory: category,
    co2SavedKg: co2,
    ewasteKg: ewaste,
    createdAt: `2026-11-${day}T00:00:00.000Z`,
  });

/** Nimal: 75 points, 87.5 kg CO2. Two other members add to the community totals. */
const seedActions = () => {
  action('user-1', 'REPAIR', 'p1', 'OTHER', 20, 40, 1, '01');
  action('user-1', 'DONATE', 'l1', 'OTHER', 25, 40, 1, '02');
  action('user-1', 'RECYCLE', 'r1', 'OTHER', 30, 7.5, 1, '03');
  ['d1', 'd2', 'd3', 'd4'].forEach((id) => action('user-2', 'REPAIR', id, 'DESKTOP', 20, 280, 8, '04'));
  action('user-3', 'RECYCLE', 'r2', 'PRINTER', 30, 22.5, 6, '05');
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('shows points, badge, impact, counts and community totals', async () => {
  seedActions();
  const root = await openEcoImpact();

  const text = allText(root);
  expect(text).toContain('75');
  expect(text).toContain('Bronze');
  expect(text).toContain('75 points to Silver');
  expect(text).toContain('+ 30');
  expect(text).toContain('87.5 kg');
  expect(text).toContain('Like not driving 515 km in a petrol car.');
  expect(text).toContain('1.2 t'); // 87.5 + 1120 + 22.5 = 1230 kg
  expect(text).toContain('3 members have kept 41 kg of electronics out of landfill.');
});

test('still shows the personal impact when community totals fail to load', async () => {
  seedActions();
  const root = await openEcoImpact(() => __fake.goOfflineAfter(1));

  expect(allText(root)).toContain('87.5 kg');
  expect(allText(root)).not.toContain('ReViveX community');
});

test('shows an error with a retry button when there is no connection', async () => {
  const root = await openEcoImpact(() => __fake.setOffline(true));

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
