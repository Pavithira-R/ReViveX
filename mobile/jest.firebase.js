/* eslint-env jest */
/**
 * In-memory stand-in for Firebase Auth + Cloud Firestore, used by every Jest test
 * (wired up in jest.setup.js, reset before each test in jest.afterEnv.js).
 *
 * Test helpers:
 *   const { __fake } = require('../jest.firebase');
 *   __fake.addAccount({ ...profile }, 'Password123')  → account + users/{uid} document
 *   __fake.setOffline(true)                          → every call fails like "no internet"
 *   __fake.goOfflineAfter(1)                         → one more Firestore call works, then offline
 *   __fake.getDoc('problemReports/abc') / __fake.docsIn('notifications')
 *   __fake.setDoc('users/u1', data)
 */

class FirebaseError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
    this.name = 'FirebaseError';
  }
}

const state = {
  accounts: new Map(), // email → { uid, password }
  docs: new Map(), // 'collection/id[/sub/id]' → data
  currentUser: null,
  listeners: new Set(),
  offline: false,
  /** Number of Firestore calls still allowed before going offline (null = off). */
  offlineAfter: null,
  /** Emails a password-reset link was sent to. */
  resetEmails: [],
  nextId: 1,
};

const newId = () => `id${state.nextId++}`;
const clone = (data) => (data === undefined ? undefined : { ...data });

const offlineCheck = (auth) => {
  if (!auth && state.offlineAfter !== null) {
    if (state.offlineAfter === 0) state.offline = true;
    else state.offlineAfter -= 1;
  }
  if (state.offline) {
    throw new FirebaseError(auth ? 'auth/network-request-failed' : 'unavailable');
  }
};

// ---------- firebase/app ----------
const app = {
  FirebaseError,
  initializeApp: (config) => ({ name: '[DEFAULT]', options: config }),
};

// ---------- firebase/auth ----------
const authInstance = {
  get currentUser() {
    return state.currentUser;
  },
};

const setCurrentUser = (user) => {
  state.currentUser = user;
  state.listeners.forEach((listener) => listener(user));
};

const auth = {
  initializeAuth: () => authInstance,
  getAuth: () => authInstance,
  getReactNativePersistence: () => ({ type: 'LOCAL' }),
  onAuthStateChanged: (_auth, listener) => {
    state.listeners.add(listener);
    Promise.resolve().then(() => {
      if (state.listeners.has(listener)) listener(state.currentUser);
    });
    return () => state.listeners.delete(listener);
  },
  createUserWithEmailAndPassword: async (_auth, email, password) => {
    offlineCheck(true);
    if (state.accounts.has(email)) throw new FirebaseError('auth/email-already-in-use');
    if (password.length < 6) throw new FirebaseError('auth/weak-password');
    const uid = `uid-${newId()}`;
    state.accounts.set(email, { uid, password });
    setCurrentUser({ uid, email });
    return { user: state.currentUser };
  },
  signInWithEmailAndPassword: async (_auth, email, password) => {
    offlineCheck(true);
    const account = state.accounts.get(email);
    if (!account || account.password !== password) throw new FirebaseError('auth/invalid-credential');
    setCurrentUser({ uid: account.uid, email });
    return { user: state.currentUser };
  },
  signOut: async () => {
    setCurrentUser(null);
  },
  sendPasswordResetEmail: async (_auth, email) => {
    offlineCheck(true);
    if (!state.accounts.has(email)) throw new FirebaseError('auth/user-not-found');
    state.resetEmails.push(email);
  },
};

// ---------- firebase/firestore ----------
const pathOf = (segments) => segments.filter((s) => typeof s === 'string').join('/');

const docRef = (path) => ({ type: 'document', path, id: path.split('/').pop() });

const snapshot = (path) => {
  const data = state.docs.get(path);
  return {
    id: path.split('/').pop(),
    ref: docRef(path),
    exists: () => data !== undefined,
    data: () => clone(data),
    get: (field) => data?.[field],
  };
};

const matches = (data, { field, op, value }) => {
  const actual = data[field];
  switch (op) {
    case '==':
      return actual === value;
    case '!=':
      return actual !== value;
    case 'in':
      return value.includes(actual);
    case 'array-contains':
      return Array.isArray(actual) && actual.includes(value);
    default:
      throw new Error(`Fake Firestore: unsupported operator ${op}`);
  }
};

const applyValue = (target, key, value) => {
  if (value && value.__op === 'increment') target[key] = (target[key] || 0) + value.by;
  else if (value && value.__op === 'serverTimestamp') target[key] = new Date().toISOString();
  else if (value && value.__op === 'delete') delete target[key];
  else target[key] = value;
};

/** updateDoc treats 'a.b' as a nested field path (setDoc does not). */
const applyChanges = (existing, changes, dottedPaths = false) => {
  const next = { ...existing };
  Object.entries(changes).forEach(([key, value]) => {
    if (dottedPaths && key.includes('.')) {
      const parts = key.split('.');
      let target = next;
      parts.slice(0, -1).forEach((part) => {
        target[part] = { ...(target[part] || {}) };
        target = target[part];
      });
      applyValue(target, parts[parts.length - 1], value);
    } else {
      applyValue(next, key, value);
    }
  });
  return next;
};

const write = {
  set: (ref, data, options) => {
    const base = options && options.merge ? state.docs.get(ref.path) || {} : {};
    state.docs.set(ref.path, applyChanges(base, data));
  },
  update: (ref, changes) => {
    if (!state.docs.has(ref.path)) throw new FirebaseError('not-found', `No document ${ref.path}`);
    state.docs.set(ref.path, applyChanges(state.docs.get(ref.path), changes, true));
  },
  delete: (ref) => {
    state.docs.delete(ref.path);
  },
};

class Bytes {
  constructor(base64) {
    this.base64 = base64;
  }
  static fromBase64String(base64) {
    return new Bytes(base64);
  }
  toBase64() {
    return this.base64;
  }
}

const firestore = {
  Bytes,
  getFirestore: () => ({ type: 'firestore' }),
  collection: (_db, ...segments) => ({ type: 'collection', path: pathOf(segments) }),
  doc: (parent, ...segments) =>
    parent && parent.type === 'collection'
      ? docRef(`${parent.path}/${segments[0] || newId()}`)
      : docRef(pathOf(segments)),
  query: (ref, ...constraints) => ({
    type: 'query',
    path: ref.path,
    constraints: [...(ref.constraints || []), ...constraints],
  }),
  where: (field, op, value) => ({ kind: 'where', field, op, value }),
  orderBy: (field, direction = 'asc') => ({ kind: 'orderBy', field, direction }),
  limit: (count) => ({ kind: 'limit', count }),
  serverTimestamp: () => ({ __op: 'serverTimestamp' }),
  increment: (by) => ({ __op: 'increment', by }),
  deleteField: () => ({ __op: 'delete' }),
  getDoc: async (ref) => {
    offlineCheck();
    return snapshot(ref.path);
  },
  getDocs: async (ref) => {
    offlineCheck();
    const depth = ref.path.split('/').length + 1;
    let paths = [...state.docs.keys()].filter(
      (p) => p.startsWith(`${ref.path}/`) && p.split('/').length === depth
    );
    (ref.constraints || []).forEach((c) => {
      if (c.kind === 'where') paths = paths.filter((p) => matches(state.docs.get(p), c));
      if (c.kind === 'orderBy') {
        const sign = c.direction === 'desc' ? -1 : 1;
        paths.sort((a, b) => {
          const x = state.docs.get(a)[c.field];
          const y = state.docs.get(b)[c.field];
          return x === y ? 0 : x > y ? sign : -sign;
        });
      }
      if (c.kind === 'limit') paths = paths.slice(0, c.count);
    });
    const docs = paths.map(snapshot);
    return { docs, empty: docs.length === 0, size: docs.length, forEach: (fn) => docs.forEach(fn) };
  },
  setDoc: async (ref, data, options) => {
    offlineCheck();
    write.set(ref, data, options);
  },
  updateDoc: async (ref, changes) => {
    offlineCheck();
    write.update(ref, changes);
  },
  deleteDoc: async (ref) => {
    offlineCheck();
    write.delete(ref);
  },
  addDoc: async (collectionRef, data) => {
    offlineCheck();
    const ref = docRef(`${collectionRef.path}/${newId()}`);
    write.set(ref, data);
    return ref;
  },
  runTransaction: async (_db, fn) => {
    offlineCheck();
    const tx = {
      get: async (ref) => snapshot(ref.path),
      set: (ref, data, options) => { write.set(ref, data, options); return tx; },
      update: (ref, changes) => { write.update(ref, changes); return tx; },
      delete: (ref) => { write.delete(ref); return tx; },
    };
    return fn(tx);
  },
  writeBatch: () => {
    const ops = [];
    const batch = {
      set: (ref, data, options) => { ops.push(() => write.set(ref, data, options)); return batch; },
      update: (ref, changes) => { ops.push(() => write.update(ref, changes)); return batch; },
      delete: (ref) => { ops.push(() => write.delete(ref)); return batch; },
      commit: async () => {
        offlineCheck();
        ops.forEach((op) => op());
      },
    };
    return batch;
  },
};

// ---------- helpers for tests ----------
const __fake = {
  reset: () => {
    state.accounts.clear();
    state.docs.clear();
    state.listeners.clear();
    state.currentUser = null;
    state.offline = false;
    state.offlineAfter = null;
    state.resetEmails = [];
    state.nextId = 1;
  },
  setOffline: (offline) => {
    state.offline = offline;
    state.offlineAfter = null;
  },
  /** The next `count` Firestore calls work, then every call fails like "no internet". */
  goOfflineAfter: (count) => {
    state.offlineAfter = count;
  },
  /** Creates a sign-in account and its `users/{id}` profile. */
  addAccount: (profile, password) => {
    const { id, ...data } = profile;
    state.accounts.set(profile.email, { uid: id, password });
    state.docs.set(`users/${id}`, data);
  },
  currentUser: () => state.currentUser,
  /** Emails a password-reset link was sent to. */
  resetEmailsSent: () => [...state.resetEmails],
  getDoc: (path) => clone(state.docs.get(path)),
  setDoc: (path, data) => state.docs.set(path, { ...data }),
  /** `{ id, ...data }` of every document directly inside a collection. */
  docsIn: (collectionPath) => {
    const depth = collectionPath.split('/').length + 1;
    return [...state.docs.entries()]
      .filter(([p]) => p.startsWith(`${collectionPath}/`) && p.split('/').length === depth)
      .map(([p, data]) => ({ id: p.split('/').pop(), ...data }));
  },
};

module.exports = { app, auth, firestore, __fake };
