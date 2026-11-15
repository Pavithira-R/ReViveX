// Member 1 – Firebase setup
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase web app configuration for the ReViveX project.
 * Not a secret: it only identifies the project. Access is controlled by
 * Firebase Authentication and the Firestore security rules (firestore.rules).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyA2tQFdnI1tR8L60-wLPRDX0fUcFyhdCF4',
  authDomain: 'revivex-aa62f.firebaseapp.com',
  projectId: 'revivex-aa62f',
  storageBucket: 'revivex-aa62f.firebasestorage.app',
  messagingSenderId: '743890469730',
  appId: '1:743890469730:web:eeb06ad3ea318b2525e23b',
};

export const app = initializeApp(firebaseConfig);

/**
 * `getReactNativePersistence` exists in Firebase's React Native build, but the
 * default TypeScript types (written for the web) don't list it.
 */
const { getReactNativePersistence } = FirebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
};

/** Signed-in user, kept after the app restarts. */
export const auth = FirebaseAuth.initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

/** Cloud Firestore: all ReViveX data (see the shared data design in the Firebase plans). */
export const db = getFirestore(app);
