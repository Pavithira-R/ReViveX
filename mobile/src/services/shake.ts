// Member 1 – Shake gesture (accelerometer)

type Subscription = { remove: () => void };
type ShakeLibrary = { addListener: (callback: () => void) => Subscription };

let shakeLibrary: ShakeLibrary | null | undefined;

/**
 * Loads react-native-shake on first use. The library throws when its native part is
 * missing (e.g. the app was not rebuilt after installing it), so it is required lazily
 * inside try/catch: a missing module just means "no shake", never a crash.
 */
const loadShake = (): ShakeLibrary | null => {
  if (shakeLibrary !== undefined) return shakeLibrary;
  try {
    shakeLibrary = require('react-native-shake').default as ShakeLibrary;
  } catch {
    shakeLibrary = null;
  }
  return shakeLibrary;
};

/**
 * Calls `onShake` whenever the phone is shaken. Returns a function that stops listening.
 * Phones without an accelerometer simply never call it; the Profile screen's
 * "Report a problem" button is the fallback.
 */
export const subscribeToShake = (onShake: () => void): (() => void) => {
  const library = loadShake();
  if (!library) return () => undefined;
  try {
    const subscription = library.addListener(onShake);
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
};
