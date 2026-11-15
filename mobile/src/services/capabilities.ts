import { useCallback, useEffect, useState } from 'react';
import * as RN from 'react-native';

const { AppState, Linking, PermissionsAndroid, Platform } = RN as any;
type Permission = any;

/**
 * Capability layer shared by every module.
 *
 * Before using hardware (camera, location, sensors, biometrics), ask here first and
 * show the feature's fallback when the answer is not 'available'. Nothing in this
 * file throws: any failure is reported as 'unsupported', so the app never crashes
 * because a phone lacks a sensor or the user said no.
 *
 *   const status = await checkCapability('camera');      // no prompt
 *   const status = await requestCapability('camera');    // prompts if needed
 *   const { status, request } = useCapability('location'); // in a screen
 */

export type CapabilityName =
  | 'camera'
  | 'location'
  | 'biometric'
  | 'accelerometer'
  | 'gyroscope'
  | 'notifications';

/**
 * - available:   hardware present and permission granted, safe to use
 * - denied:      hardware present but permission not granted (yet, or refused)
 * - unsupported: hardware missing, or the check itself failed
 */
export type CapabilityStatus = 'available' | 'denied' | 'unsupported';

export interface CapabilityDefinition {
  /** Android runtime permissions; any one granted is enough (e.g. coarse OR fine location). */
  permissions?: Permission[];
  /**
   * Hardware/feature presence check. Registered by the module that owns the feature,
   * e.g. Member 2 registers a camera-device check, Member 3 the sensor checks.
   */
  isSupported?: () => Promise<boolean>;
}

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

// POST_NOTIFICATIONS is only a runtime permission from Android 13 (API 33).
const needsNotificationPermission = Platform.OS === 'android' && Number(Platform.Version) >= 33;

const definitions: Record<CapabilityName, CapabilityDefinition> = {
  camera: { permissions: [PERMISSIONS.CAMERA] },
  location: { permissions: [PERMISSIONS.ACCESS_COARSE_LOCATION, PERMISSIONS.ACCESS_FINE_LOCATION] },
  notifications: {
    permissions: needsNotificationPermission ? [PERMISSIONS.POST_NOTIFICATIONS] : [],
  },
  // No permission needed; presence is unknown until the owning module registers a check.
  biometric: {},
  accelerometer: {},
  gyroscope: {},
};

/**
 * Add or replace parts of a capability's definition. Call once at module load:
 *   registerCapability('accelerometer', { isSupported: async () => ... });
 */
export const registerCapability = (
  name: CapabilityName,
  definition: CapabilityDefinition
): void => {
  definitions[name] = { ...definitions[name], ...definition };
};

const hasPermissions = (def: CapabilityDefinition): boolean => def.permissions !== undefined;

const isPresent = async (def: CapabilityDefinition): Promise<boolean> => {
  if (def.isSupported) return def.isSupported();
  // Permission-based features are assumed present; others need a registered check.
  return hasPermissions(def);
};

const isGranted = async (permissions: Permission[]): Promise<boolean> => {
  // iOS asks through each feature's own library, so only Android is checked here.
  if (permissions.length === 0 || Platform.OS !== 'android') return true;
  const results = await Promise.all(permissions.map((p) => PermissionsAndroid.check(p)));
  return results.some(Boolean);
};

/** Current status without prompting the user. */
export const checkCapability = async (name: CapabilityName): Promise<CapabilityStatus> => {
  try {
    const def = definitions[name];
    if (!(await isPresent(def))) return 'unsupported';
    return (await isGranted(def.permissions ?? [])) ? 'available' : 'denied';
  } catch {
    return 'unsupported';
  }
};

/**
 * Ask for the permission if needed. Call this when the user starts the feature
 * (e.g. taps "Take photo"), not at app start.
 */
export const requestCapability = async (name: CapabilityName): Promise<CapabilityStatus> => {
  const current = await checkCapability(name);
  if (current !== 'denied' || Platform.OS !== 'android') return current;

  try {
    const results = await PermissionsAndroid.requestMultiple(definitions[name].permissions ?? []);
    return Object.values(results).some((r) => r === RESULTS.GRANTED) ? 'available' : 'denied';
  } catch {
    return 'unsupported';
  }
};

/** For a permanently denied permission: let the user turn it on in system settings. */
export const openAppSettings = (): void => {
  Linking.openSettings().catch(() => undefined);
};

/**
 * Screen hook. Re-checks when the app returns to the foreground, so a permission
 * granted in system settings is picked up without restarting.
 */
export const useCapability = (name: CapabilityName) => {
  const [status, setStatus] = useState<CapabilityStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await checkCapability(name));
  }, [name]);

  const request = useCallback(async () => {
    const result = await requestCapability(name);
    setStatus(result);
    return result;
  }, [name]);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state: any) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { status, isChecking: status === null, request, refresh };
};
