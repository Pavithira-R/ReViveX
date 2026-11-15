/**
 * Member 6 – Messages list and chat screen on the fake Firestore
 * (`conversations/{uidA_uidB}` + `messages` subcollection).
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

const { __fake } = require('../jest.firebase');

const profile = (id: string, name: string, email: string, role: string) => ({
  id,
  name,
  email,
  role,
  phone: null,
  profileImage: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const user = profile('a-owner', 'Nimal Perera', 'nimal@example.com', 'ITEM_OWNER');
const tech = profile('b-tech', 'Kasun Repairs', 'kasun@example.com', 'SERVICE_PROVIDER');
const chatId = 'a-owner_b-tech';

const seedChat = () => {
  __fake.setDoc(`conversations/${chatId}`, {
    participants: ['a-owner', 'b-tech'],
    participantInfo: {
      'a-owner': { name: user.name, role: user.role },
      'b-tech': { name: tech.name, role: tech.role },
    },
    lastMessage: { body: 'Your laptop is ready.', senderId: 'b-tech', createdAt: '2026-11-14T10:00:00.000Z' },
    unread: { 'a-owner': 1, 'b-tech': 0 },
    updatedAt: '2026-11-14T10:00:00.000Z',
  });
  __fake.setDoc(`conversations/${chatId}/messages/m1`, {
    senderId: 'b-tech',
    body: 'Your laptop is ready.',
    readAt: null,
    createdAt: '2026-11-14T10:00:00.000Z',
  });
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

let renderer: ReactTestRenderer.ReactTestRenderer;

const openMessages = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;

  await type(root, 'Email address', user.email);
  await type(root, 'Password', 'Password123');
  await press(root, 'Sign In');

  await press(root, 'Messages');
  return root;
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
  __fake.addAccount(tech, 'Password123');
});

afterEach(async () => {
  // Stops the chat's auto-refresh timer.
  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });
});

test('lists chats with the last message and unread count', async () => {
  seedChat();
  const root = await openMessages();

  expect(allText(root)).toContain('Kasun Repairs');
  expect(allText(root)).toMatch(/Your laptop is ready\. 1/); // unread badge
});

test('opens a chat, marks it read and sends a new message', async () => {
  seedChat();
  const root = await openMessages();

  await press(root, 'Kasun Repairs');
  expect(allText(root)).toContain('Your laptop is ready.');
  expect(__fake.getDoc(`conversations/${chatId}/messages/m1`).readAt).toEqual(expect.any(String));
  expect(__fake.getDoc(`conversations/${chatId}`).unread['a-owner']).toBe(0);

  await type(root, 'Message', 'When can I collect it?');
  await press(root, 'Send');

  expect(allText(root)).toContain('When can I collect it?');
  expect(__fake.docsIn(`conversations/${chatId}/messages`)).toHaveLength(2);
  expect(__fake.getDoc(`conversations/${chatId}`)).toMatchObject({
    lastMessage: { body: 'When can I collect it?', senderId: 'a-owner' },
    unread: { 'b-tech': 1 },
  });
  // The other person is notified.
  expect(__fake.docsIn('notifications')).toEqual([
    expect.objectContaining({ userId: 'b-tech', type: 'MESSAGE', title: 'New message from Nimal Perera' }),
  ]);
});

test('starts a new chat by email', async () => {
  const root = await openMessages();
  expect(allText(root)).toContain('No chats yet');

  await type(root, 'Start a new chat', 'Kasun@Example.com');
  await press(root, 'Start chat');

  expect(__fake.getDoc(`conversations/${chatId}`)).toMatchObject({ participants: ['a-owner', 'b-tech'] });
  expect(allText(root)).toMatch(/Say hello to\s+Kasun Repairs/);
});

test('an unknown email shows "User not found"', async () => {
  const root = await openMessages();

  await type(root, 'Start a new chat', 'nobody@example.com');
  await press(root, 'Start chat');

  expect(allText(root)).toContain('User not found');
  expect(__fake.docsIn('conversations')).toEqual([]);
});

test('an invalid email is rejected without creating a chat', async () => {
  const root = await openMessages();

  await type(root, 'Start a new chat', 'not-an-email');
  await press(root, 'Start chat');

  expect(allText(root)).toContain('Enter the email address');
  expect(__fake.docsIn('conversations')).toEqual([]);
});

test('shows an error with a retry button when offline', async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;
  await type(root, 'Email address', user.email);
  await type(root, 'Password', 'Password123');
  await press(root, 'Sign In');

  __fake.setOffline(true);
  await press(root, 'Messages');

  expect(allText(root)).toContain('Cannot reach the server');
  expect(button(root, 'Try again')).toBeDefined();
});
