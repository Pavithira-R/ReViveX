/**
 * Member 6 – Notifications screen with a mocked backend.
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
      allText(node).includes(title)
  )[0];

const press = async (root: ReactTestInstance, title: string) => {
  await ReactTestRenderer.act(async () => {
    button(root, title).props.onPress();
  });
};

const lastCall = () => {
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const [url, init] = calls[calls.length - 1];
  return { url: url as string, method: init.method as string };
};

/** Signs in, then opens Notifications; `mockList` queues the GET /notifications reply. */
const openNotifications = async (mockList: () => void) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  mockFetchResponse(200, ok({ token: 'jwt-token-123', user }));
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(user.email);
    input(root, 'Password').props.onChangeText('Password123');
  });
  await press(root, 'Sign In');

  mockList();
  await press(root, 'Notifications');
  return root;
};

const notifications = {
  items: [
    {
      id: 'n2',
      type: 'ECO',
      title: 'Eco points earned',
      message: '+30 points for recycling a device.',
      refId: 'r1',
      isRead: false,
      createdAt: '2026-11-14T10:00:00.000Z',
    },
    {
      id: 'n1',
      type: 'REPAIR',
      title: 'Repair completed',
      message: 'Your laptop is ready for pickup.',
      refId: 'p1',
      isRead: true,
      createdAt: '2026-11-13T10:00:00.000Z',
    },
  ],
  unreadCount: 1,
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

test('lists notifications and marks one as read when tapped', async () => {
  const root = await openNotifications(() => mockFetchResponse(200, ok(notifications)));

  expect(lastCall()).toEqual({ url: expect.stringMatching(/\/notifications$/), method: 'GET' });
  expect(allText(root)).toContain('Eco points earned');
  expect(allText(root)).toContain('Repair completed');
  expect(allText(root)).toContain('Mark all as read (1)');

  mockFetchResponse(200, ok({ ...notifications.items[0], isRead: true }));
  await press(root, 'Eco points earned');

  expect(lastCall()).toEqual({ url: expect.stringMatching(/\/notifications\/n2\/read$/), method: 'PATCH' });
  expect(allText(root)).not.toContain('Mark all as read');
});

test('marks all notifications as read', async () => {
  const root = await openNotifications(() => mockFetchResponse(200, ok(notifications)));

  mockFetchResponse(200, ok({ updated: 1 }));
  await press(root, 'Mark all as read');

  expect(lastCall()).toEqual({ url: expect.stringMatching(/\/notifications\/read-all$/), method: 'PATCH' });
  expect(allText(root)).not.toContain('Mark all as read');
});

test('shows an empty message when there are no notifications', async () => {
  const root = await openNotifications(() => mockFetchResponse(200, ok({ items: [], unreadCount: 0 })));

  expect(allText(root)).toContain('No notifications yet');
});

test('shows an error with a retry button when offline', async () => {
  const root = await openNotifications(() =>
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  );

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
