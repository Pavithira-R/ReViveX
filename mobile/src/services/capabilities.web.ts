import { useCallback, useEffect, useState } from 'react';

export type CapabilityName =
  | 'camera'
  | 'location'
  | 'biometric'
  | 'accelerometer'
  | 'gyroscope'
  | 'notifications';

export type CapabilityStatus = 'available' | 'denied' | 'unsupported';

export interface CapabilityDefinition {
  isSupported?: () => Promise<boolean>;
}

const definitions: Record<CapabilityName, CapabilityDefinition> = {
  camera: {},
  location: {},
  biometric: {},
  accelerometer: {},
  gyroscope: {},
  notifications: {},
};

export const registerCapability = (
  name: CapabilityName,
  definition: CapabilityDefinition,
): void => {
  definitions[name] = { ...definitions[name], ...definition };
};

export const checkCapability = async (
  name: CapabilityName,
): Promise<CapabilityStatus> => {
  try {
    const definition = definitions[name];

    if (!definition.isSupported) {
      return 'unsupported';
    }

    return (await definition.isSupported()) ? 'available' : 'unsupported';
  } catch {
    return 'unsupported';
  }
};

export const requestCapability = async (
  name: CapabilityName,
): Promise<CapabilityStatus> => {
  return checkCapability(name);
};

export const openAppSettings = (): void => {
  // Browser applications cannot open native application settings.
};

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
  }, [refresh]);

  return {
    status,
    isChecking: status === null,
    request,
    refresh,
  };
};
