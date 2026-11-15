/**
 * Member 1 – Sign in / sign out (TC-AUTH-05/06, TC-UI-03) and the auth + admin
 * services on the in-memory Firebase from jest.firebase.js.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';
import { adminService, ApiError, authService } from '../src/services';

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
      allText(node) === title
  )[0];

let renderer: ReactTestRenderer.ReactTestRenderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer.root;
};

const signIn = async (root: ReactTestInstance, email: string, password: string) => {
  await ReactTestRenderer.act(async () => {
    input(root, 'Email address').props.onChangeText(email);
    input(root, 'Password').props.onChangeText(password);
  });
  await ReactTestRenderer.act(async () => {
    button(root, 'Sign In').props.onPress();
  });
};

const expectApiError = async (promise: Promise<unknown>, message: string) => {
  const error = (await promise.catch((e: unknown) => e)) as ApiError;
  expect(error).toBeInstanceOf(ApiError);
  expect(error.message).toBe(message);
  return error;
};

beforeEach(() => {
  __fake.addAccount(user, 'Password123');
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

describe('login screen', () => {
  test('shows a validation message for an invalid email without signing in', async () => {
    const root = await renderApp();
    await signIn(root, 'not-an-email', 'Password123');

    expect(allText(root)).toContain('Please enter a valid email address.');
    expect(__fake.currentUser()).toBeNull();
  });

  test('shows "Invalid email or password" when the password is wrong', async () => {
    const root = await renderApp();
    await signIn(root, 'nimal@example.com', 'WrongPass1');

    expect(allText(root)).toContain('Invalid email or password');
    expect(allText(root)).toContain('Welcome back');
  });

  test('signs in, opens the home screen and signs out from the profile', async () => {
    const root = await renderApp();
    await signIn(root, 'nimal@example.com', 'Password123');

    expect(__fake.currentUser().uid).toBe('user-1');
    expect(allText(root)).toMatch(/Hello,\s+Nimal/);

    await ReactTestRenderer.act(async () => {
      button(root, 'My Profile').props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      button(root, 'Log Out').props.onPress();
    });

    expect(__fake.currentUser()).toBeNull();
    expect(allText(root)).toContain('Welcome back');
  });

  test('a deactivated account cannot sign in', async () => {
    __fake.setDoc('users/user-1', { ...user, isActive: false });
    const root = await renderApp();
    await signIn(root, 'nimal@example.com', 'Password123');

    expect(allText(root)).toContain('Account has been deactivated');
    expect(__fake.currentUser()).toBeNull();
  });
});

describe('forgot password', () => {
  const tapForgot = async (root: ReactTestInstance, email: string) => {
    await ReactTestRenderer.act(async () => {
      input(root, 'Email address').props.onChangeText(email);
    });
    await ReactTestRenderer.act(async () => {
      button(root, 'Forgot password?').props.onPress();
    });
  };

  test('emails a reset link to the typed address', async () => {
    const root = await renderApp();
    await tapForgot(root, ' Nimal@Example.com ');

    expect(__fake.resetEmailsSent()).toEqual(['nimal@example.com']);
    expect(allText(root)).toContain('a link to reset your password has been sent');
  });

  test('shows the same message for an unknown email (does not reveal accounts)', async () => {
    const root = await renderApp();
    await tapForgot(root, 'nobody@example.com');

    expect(__fake.resetEmailsSent()).toEqual([]);
    expect(allText(root)).toContain('If nobody@example.com has a ReViveX account');
  });

  test('asks for the email first when the field is empty', async () => {
    const root = await renderApp();
    await tapForgot(root, '');

    expect(allText(root)).toContain('Enter your email address above');
    expect(__fake.resetEmailsSent()).toEqual([]);
  });
});

describe('authService', () => {
  test('register creates the account and a users/{uid} profile', async () => {
    const result = await authService.register({
      name: '  Kamala Silva ',
      email: 'Kamala@Example.com',
      password: 'Secret123',
      role: 'SERVICE_PROVIDER',
    });

    expect(result.user).toMatchObject({ name: 'Kamala Silva', email: 'kamala@example.com', role: 'SERVICE_PROVIDER' });
    expect(__fake.getDoc(`users/${result.user.id}`)).toMatchObject({
      email: 'kamala@example.com',
      role: 'SERVICE_PROVIDER',
      isActive: true,
    });
  });

  test('register refuses ADMIN and weak passwords before calling Firebase', async () => {
    const error = await expectApiError(
      authService.register({ name: 'X', email: 'x@example.com', password: 'short', role: 'ADMIN' }),
      'Validation failed'
    );
    expect(error.details).toEqual([
      'Password must be at least 8 characters and contain both letters and numbers',
      'Registration as ADMIN is not allowed through public registration',
    ]);
    expect(__fake.currentUser()).toBeNull();
  });

  test('register reports an email that is already used', async () => {
    await expectApiError(
      authService.register({ name: 'Nimal', email: 'nimal@example.com', password: 'Password123' }),
      'Email address is already registered'
    );
  });

  test('updateMe changes only profile fields', async () => {
    await authService.login({ email: 'nimal@example.com', password: 'Password123' });
    const updated = await authService.updateMe({
      name: 'Nimal P.',
      phone: '+94 77 123 4567',
      role: 'ADMIN',
    } as never);

    expect(updated).toMatchObject({ name: 'Nimal P.', phone: '+94 77 123 4567', role: 'ITEM_OWNER' });
  });

  test('no connection becomes a NETWORK_ERROR, so the offline messages still work', async () => {
    __fake.setOffline(true);
    const error = await authService.login({ email: 'nimal@example.com', password: 'Password123' }).catch((e) => e);
    expect(error.code).toBe('NETWORK_ERROR');
  });
});

describe('adminService', () => {
  const admin = { ...user, id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' };

  beforeEach(async () => {
    __fake.addAccount(admin, 'Password123');
    await authService.login({ email: admin.email, password: 'Password123' });
  });

  test('lists users with search, role filter and paging', async () => {
    const all = await adminService.listUsers();
    expect(all.total).toBe(2);

    const owners = await adminService.listUsers({ role: 'ITEM_OWNER' });
    expect(owners.items.map((u) => u.id)).toEqual(['user-1']);

    const search = await adminService.listUsers({ search: 'ADMIN@' });
    expect(search.items.map((u) => u.id)).toEqual(['admin-1']);

    const page2 = await adminService.listUsers({ limit: 1, page: 2 });
    expect(page2).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(page2.items).toHaveLength(1);
  });

  test('changes roles and deactivates other users', async () => {
    expect((await adminService.changeRole('user-1', 'RECYCLER')).role).toBe('RECYCLER');
    expect((await adminService.setActive('user-1', false)).isActive).toBe(false);
  });

  test('admins cannot change or deactivate themselves', async () => {
    await expectApiError(adminService.changeRole('admin-1', 'ITEM_OWNER'), 'Admins cannot change their own role');
    await expectApiError(adminService.setActive('admin-1', false), 'Admins cannot deactivate their own account');
  });
});
