import * as Keychain from 'react-native-keychain';
import { registerCapability } from './capabilities';

/**
 * Encrypted storage for the login token (Android Keystore / iOS Keychain).
 *
 * Two separate entries:
 * - session:   lets the user stay signed in after the app restarts; cleared on logout.
 * - biometric: a copy that can only be read after a fingerprint/face scan; kept after
 *              logout so the user can sign back in with their fingerprint.
 *
 * Nothing here throws: storage problems just mean "no saved token", and the user
 * signs in with email and password instead.
 */

const ACCOUNT = 'revivex';
const SESSION_SERVICE = 'revivex.session';
const BIOMETRIC_SERVICE = 'revivex.biometric';

registerCapability('biometric', {
  isSupported: async () => (await Keychain.getSupportedBiometryType()) !== null,
});

export const saveSessionToken = async (token: string): Promise<void> => {
  try {
    await Keychain.setGenericPassword(ACCOUNT, token, {
      service: SESSION_SERVICE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  } catch {
    // Not fatal: the user just signs in again next time.
  }
};

export const loadSessionToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
};

export const clearSessionToken = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
  } catch {
    // Nothing to clear.
  }
};

export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  try {
    return await Keychain.hasGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    return false;
  }
};

/** Store a fingerprint-protected copy of the token. Returns false if it could not be saved. */
export const enableBiometricLogin = async (token: string): Promise<boolean> => {
  try {
    const result = await Keychain.setGenericPassword(ACCOUNT, token, {
      service: BIOMETRIC_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      storage: Keychain.STORAGE_TYPE.AES_GCM,
      authenticationPrompt: { title: 'Turn on fingerprint login', cancel: 'Cancel' },
    });
    return result !== false;
  } catch {
    return false;
  }
};

/** Ask for a fingerprint scan and return the saved token, or null if cancelled or failed. */
export const unlockWithBiometrics = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: {
        title: 'Log in to ReViveX',
        subtitle: 'Use your fingerprint',
        cancel: 'Use password',
      },
    });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
};

export const disableBiometricLogin = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    // Nothing to clear.
  }
};
