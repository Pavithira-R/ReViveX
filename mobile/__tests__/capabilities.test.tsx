/**
 * Capability layer + error boundary: hardware or permission problems must never crash the app.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PermissionsAndroid, Platform, Text } from 'react-native';
import { ErrorBoundary } from '../src/components';
import {
  checkCapability,
  registerCapability,
  requestCapability,
} from '../src/services/capabilities';

const originalOS = Platform.OS;

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue(
    {} as Awaited<ReturnType<typeof PermissionsAndroid.requestMultiple>>
  );
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  jest.restoreAllMocks();
});

test('a granted permission is reported as available', async () => {
  (PermissionsAndroid.check as jest.Mock).mockResolvedValue(true);
  expect(await checkCapability('camera')).toBe('available');
});

test('location counts as available when only coarse location is granted', async () => {
  (PermissionsAndroid.check as jest.Mock).mockImplementation(
    async (p: string) => p === PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
  );
  expect(await checkCapability('location')).toBe('available');
});

test('a permission the user refuses is reported as denied', async () => {
  (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
    [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.DENIED,
  });
  expect(await requestCapability('camera')).toBe('denied');
});

test('a permission the user accepts is reported as available', async () => {
  (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
    [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.GRANTED,
  });
  expect(await requestCapability('camera')).toBe('available');
});

test('a sensor with no registered check is unsupported, never an error', async () => {
  expect(await checkCapability('gyroscope')).toBe('unsupported');
});

test('missing hardware is unsupported and the user is not prompted', async () => {
  registerCapability('accelerometer', { isSupported: async () => false });
  expect(await requestCapability('accelerometer')).toBe('unsupported');
  expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled();
});

test('a failing hardware check is unsupported instead of crashing', async () => {
  registerCapability('biometric', {
    isSupported: async () => {
      throw new Error('native module missing');
    },
  });
  expect(await checkCapability('biometric')).toBe('unsupported');
});

test('the error boundary shows a fallback screen when a screen throws', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const Broken = () => {
    throw new Error('boom');
  };

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
  });

  const texts = renderer.root.findAllByType(Text).map((t) => t.props.children);
  expect(texts).toContain('Something went wrong');
});
