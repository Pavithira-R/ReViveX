// Member 1 – Fingerprint login storage
import * as Keychain from 'react-native-keychain';
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

registerCapability('biometric', {
  isSupported: async () => (await Keychain.getSupportedBiometryType()) !== null,
});

export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  try {
    return await Keychain.hasGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    return false;
  }
};

/** Save the sign-in details behind the fingerprint. Returns false if they could not be saved. */
export const enableBiometricLogin = async (secret: string): Promise<boolean> => {
  try {
    const result = await Keychain.setGenericPassword(ACCOUNT, secret, {
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

/** Ask for a fingerprint scan and return the saved sign-in details, or null if cancelled or failed. */
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
