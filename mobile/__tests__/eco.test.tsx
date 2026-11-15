/**
 * Member 6 – My Eco Impact screen with a mocked backend.
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
    .filter((child) => typeof child === 'string' || typeof child === 'number')
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

/** Signs in, then opens My Eco Impact; `mockEcoResponse` queues the /eco/me reply after login's. */
const openEcoImpact = async (mockEcoResponse: () => void) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  __fake.addAccount(user, 'Password123');
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await ReactTestRenderer.act(async () => {
    button(root, 'Sign In').props.onPress();
  });
  mockEcoResponse();
  await ReactTestRenderer.act(async () => {
    button(root, 'My Eco Impact').props.onPress();
  });
  return root;
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

const community = {
  co2SavedKg: 1234.5,
  ewasteDivertedKg: 56.8,
  drivingKmEquivalent: 7262,
  devicesCount: 42,
  contributors: 3,
};

test('shows points, badge, impact, counts and community totals from the server', async () => {
  const root = await openEcoImpact(() => {
    mockEcoSummary();
    mockFetchResponse(200, { success: true, message: 'OK', data: community, error: null });
  });

  const [ecoUrl] = (globalThis.fetch as jest.Mock).mock.calls[0];
  expect(ecoUrl).toMatch(/\/eco\/me$/);
  expect((globalThis.fetch as jest.Mock).mock.calls[1][0]).toMatch(/\/eco\/community$/);

  const text = allText(root);
  expect(text).toContain('75');
  expect(text).toContain('Bronze');
  expect(text).toContain('75 points to Silver');
  expect(text).toContain('+ 30');
  expect(text).toContain('87.5 kg');
  expect(text).toContain('Like not driving 515 km in a petrol car.');
  expect(text).toContain('1.2 t');
  expect(text).toContain('3 members have kept 56.8 kg of electronics out of landfill.');
});

test('still shows the personal impact when community totals fail to load', async () => {
  const root = await openEcoImpact(() => {
    mockEcoSummary();
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  });

  expect(allText(root)).toContain('87.5 kg');
  expect(allText(root)).not.toContain('ReViveX community');
});

const mockEcoSummary = () => mockFetchResponse(200, {
    success: true,
    message: 'Eco impact retrieved',
    data: {
      totalPoints: 75,
      badge: 'BRONZE',
      nextBadge: { badge: 'SILVER', pointsNeeded: 75 },
      counts: { REPAIR: 1, REUSE: 0, SELL: 0, DONATE: 1, RECYCLE: 1 },
      impact: { co2SavedKg: 87.5, ewasteDivertedKg: 3, drivingKmEquivalent: 515 },
      recent: [
        {
          id: 'e1',
          type: 'RECYCLE',
          points: 30,
          refId: 'r1',
          deviceCategory: 'OTHER',
          co2SavedKg: 7.5,
          createdAt: '2026-11-03T00:00:00.000Z',
        },
      ],
    },
    error: null,
  });

test('shows an error with a retry button when the server cannot be reached', async () => {
  const root = await openEcoImpact(() =>
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  );

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
