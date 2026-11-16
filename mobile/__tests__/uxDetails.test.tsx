/**
 * Member 1 – Small form details: show/hide password, live password rules, logout confirmation.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import App from '../App';
import { AppIcon, FormInput, PasswordChecklist } from '../src/components';

const { __fake } = require('../jest.firebase');

const allText = (root: ReactTestInstance): string =>
  root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .flat(Infinity)
    .filter((child) => typeof child === 'string')
    .join(' ');

const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];

test('the eye button shows and hides the password', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<FormInput label="Password" secureTextEntry value="Secret123" />);
  });
  const field = () =>
    renderer.root.findAll((node) => node.props.accessibilityLabel === 'Password' && 'secureTextEntry' in node.props)[0];

  expect(field().props.secureTextEntry).toBe(true);
  await ReactTestRenderer.act(async () => byLabel(renderer.root, 'Show password').props.onPress());
  expect(field().props.secureTextEntry).toBe(false);
  await ReactTestRenderer.act(async () => byLabel(renderer.root, 'Hide password').props.onPress());
  expect(field().props.secureTextEntry).toBe(true);
});

test('the password checklist ticks each rule as it is met', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<PasswordChecklist password="abc" confirmPassword="abd" />);
  });
  const ticked = () =>
    renderer.root.findAllByType(AppIcon).filter((icon) => icon.props.name === 'check-circle').length;

  expect(ticked()).toBe(1); // only "Contains a letter"
  await ReactTestRenderer.act(async () => {
    renderer.update(<PasswordChecklist password="abcdef12" confirmPassword="abcdef12" />);
  });
  expect(ticked()).toBe(4);
  expect(allText(renderer.root)).toContain('Passwords match');
});

test('Log Out asks for confirmation first', async () => {
  __fake.addAccount(
    {
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
    },
    'Password123'
  );
  await require('firebase/auth').signInWithEmailAndPassword(null, 'nimal@example.com', 'Password123');
  (Alert.alert as jest.Mock).mockImplementation(() => undefined); // user does not answer yet

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => byLabel(renderer.root, 'My Profile').props.onPress());
  const logOut = renderer.root.findAll(
    (node) => node.props.accessibilityRole === 'button' && allText(node) === 'Log Out'
  )[0];
  await ReactTestRenderer.act(async () => logOut.props.onPress());

  expect(Alert.alert).toHaveBeenCalledWith('Log out of ReViveX?', expect.any(String), expect.any(Array));
  expect(__fake.currentUser()).not.toBeNull(); // still signed in until confirmed
  await ReactTestRenderer.act(async () => renderer.unmount());
});
