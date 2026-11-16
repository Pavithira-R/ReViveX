// Member 1 – Fingerprint login storage
import { registerCapability } from './capabilities';

/**
 * Encrypted, fingerprint-protected storage (Android Keystore / iOS Keychain) for the
 * sign-in details used by fingerprint login. It can only be read after a fingerprint/face
 * scan and is kept after logout, so the user can sign back in with their fingerprint.
 * (Staying signed in after a restart is handled by Firebase itself.)
 *
 * Nothing here throws: storage problems just mean "nothing saved", and the user
 * signs in with email and password instead.
 */

const ACCOUNT = 'revivex';
const BIOMETRIC_SERVICE = 'revivex.biometric';

let KeychainModule: any = null;
try {
  KeychainModule = require('react-native-keychain');
} catch {
  KeychainModule = null;
}

const isKeychainAvailable = (): boolean => {
  try {
    return KeychainModule !== null && typeof KeychainModule?.getSupportedBiometryType === 'function';
  } catch {
    return false;
  }
};

registerCapability('biometric', {
  isSupported: async () => {
    try {
      if (!isKeychainAvailable()) return false;
      return (await KeychainModule.getSupportedBiometryType()) !== null;
    } catch {
      return false;
    }
  },
});

export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  try {
    if (!isKeychainAvailable()) return false;
    return await KeychainModule.hasGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    return false;
  }
};

/** Save the sign-in details behind the fingerprint. Returns false if they could not be saved. */
export const enableBiometricLogin = async (secret: string): Promise<boolean> => {
  try {
    if (!isKeychainAvailable()) return false;
    const result = await KeychainModule.setGenericPassword(ACCOUNT, secret, {
      service: BIOMETRIC_SERVICE,
      accessControl: KeychainModule.ACCESS_CONTROL?.BIOMETRY_ANY,
      storage: KeychainModule.STORAGE_TYPE?.AES_GCM,
      authenticationPrompt: { title: 'Turn on fingerprint login', cancel: 'Cancel' },
    });
    return result !== false;
  } catch {
    return false;
  }
};

/** Ask for a fingerprint scan and return the saved sign-in details, or null if cancelled or failed. */
export const unlockWithBiometrics = async (): Promise<string | null> => {
  try {
    if (!isKeychainAvailable()) return null;
    const credentials = await KeychainModule.getGenericPassword({
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
    if (!isKeychainAvailable()) return;
    await KeychainModule.resetGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    // Nothing to clear.
  }
};
