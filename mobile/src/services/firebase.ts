import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'revivex-demo.firebaseapp.com',
  projectId: 'revivex-demo',
  storageBucket: 'revivex-demo.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:demo-app',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
