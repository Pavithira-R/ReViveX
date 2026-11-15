/**
 * Member 6 – Messages list and chat screen with a mocked backend.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

const { __fake } = require('../jest.firebase');

const user = {
  id: 'a-owner',
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

const conversation = {
  id: 'c1',
  otherUser: { id: 'b-tech', name: 'Kasun Repairs', role: 'SERVICE_PROVIDER' },
  lastMessage: { body: 'Your laptop is ready.', senderId: 'b-tech', createdAt: '2026-11-14T10:00:00.000Z' },
  unreadCount: 1,
  updatedAt: '2026-11-14T10:00:00.000Z',
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
    .filter((child) => typeof child === 'string' || typeof child === 'number')
    .join(' ');

const input = (root: ReactTestInstance, label: string) =>
  root.findAll((node) => node.props.accessibilityLabel === label && !!node.props.onChangeText)[0];

const button = (root: ReactTestInstance, text: string) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      allText(node).includes(text)
  )[0];

const press = async (root: ReactTestInstance, text: string) => {
  await ReactTestRenderer.act(async () => {
    button(root, text).props.onPress();
  });
};

const type = async (root: ReactTestInstance, label: string, value: string) => {
  await ReactTestRenderer.act(async () => {
    input(root, label).props.onChangeText(value);
  });
};

const lastCall = () => {
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const [url, init] = calls[calls.length - 1];
  return { url: url as string, method: init.method as string, body: init.body && JSON.parse(init.body) };
};

let renderer: ReactTestRenderer.ReactTestRenderer;

/** Signs in, then opens Messages; `mockList` queues the GET /conversations reply. */
const openMessages = async (mockList: () => void) => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  __fake.addAccount(user, 'Password123');
  await type(root, 'Email address', user.email);
  await type(root, 'Password', 'Password123');
  await press(root, 'Sign In');

  mockList();
  await press(root, 'Messages');
  return root;
};

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

afterEach(async () => {
  // Stops the chat's auto-refresh timer.
  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });
});

test('lists chats with the last message and unread count', async () => {
  const root = await openMessages(() => mockFetchResponse(200, ok([conversation])));

  expect(lastCall()).toMatchObject({ url: expect.stringMatching(/\/conversations$/), method: 'GET' });
  expect(allText(root)).toContain('Kasun Repairs');
  expect(allText(root)).toContain('Your laptop is ready.');
  expect(allText(root)).toMatch(/Your laptop is ready\. 1/); // unread badge
});

test('opens a chat, shows the messages and sends a new one', async () => {
  const root = await openMessages(() => mockFetchResponse(200, ok([conversation])));

  mockFetchResponse(
    200,
    ok({
      conversation: { ...conversation, unreadCount: 0 },
      messages: [
        { id: 'm1', senderId: 'b-tech', body: 'Your laptop is ready.', isMine: false, readAt: null, createdAt: '2026-11-14T10:00:00.000Z' },
      ],
    })
  );
  await press(root, 'Kasun Repairs');
  expect(lastCall()).toMatchObject({ url: expect.stringMatching(/\/conversations\/c1\/messages$/), method: 'GET' });
  expect(allText(root)).toContain('Your laptop is ready.');

  await type(root, 'Message', 'When can I collect it?');
  mockFetchResponse(
    201,
    ok({ id: 'm2', senderId: user.id, body: 'When can I collect it?', isMine: true, readAt: null, createdAt: '2026-11-14T10:05:00.000Z' })
  );
  await press(root, 'Send');

  expect(lastCall()).toEqual({
    url: expect.stringMatching(/\/conversations\/c1\/messages$/),
    method: 'POST',
    body: { body: 'When can I collect it?' },
  });
  expect(allText(root)).toContain('When can I collect it?');
});

test('starts a new chat by email', async () => {
  const root = await openMessages(() => mockFetchResponse(200, ok([])));
  expect(allText(root)).toContain('No chats yet');

  await type(root, 'Start a new chat', 'kasun@example.com');
  mockFetchResponse(200, ok({ ...conversation, lastMessage: null, unreadCount: 0 })); // POST /conversations
  mockFetchResponse(200, ok({ conversation, messages: [] })); // GET messages of the new chat
  await press(root, 'Start chat');

  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const [startUrl, startInit] = calls[calls.length - 2];
  expect(startUrl).toMatch(/\/conversations$/);
  expect(JSON.parse(startInit.body)).toEqual({ email: 'kasun@example.com' });
  expect(allText(root)).toMatch(/Say hello to\s+Kasun Repairs/);
});

test('an invalid email is rejected without calling the server', async () => {
  const root = await openMessages(() => mockFetchResponse(200, ok([])));
  const callsBefore = (globalThis.fetch as jest.Mock).mock.calls.length;

  await type(root, 'Start a new chat', 'not-an-email');
  await press(root, 'Start chat');

  expect(allText(root)).toContain('Enter the email address');
  expect((globalThis.fetch as jest.Mock).mock.calls.length).toBe(callsBefore);
});

test('shows an error with a retry button when offline', async () => {
  const root = await openMessages(() =>
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  );

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
