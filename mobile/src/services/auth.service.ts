// Member 1 – Authentication & User Management (Firebase)
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso, toApiError } from './firebaseHelpers';
import {
  AuthResult,
  LoginCredentials,
  Paginated,
  PUBLIC_ROLES,
  PublicUser,
  RegisterData,
  UpdateProfileData,
  User,
  UserRole,
} from '../types';
import { isValidEmail, isValidPassword } from '../utils';

const NAME_MAX_LENGTH = 100;
const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;
const ALL_ROLES: UserRole[] = [...PUBLIC_ROLES, 'ADMIN'];
const PROFILE_FIELDS: (keyof UpdateProfileData)[] = ['name', 'phone', 'profileImage', 'latitude', 'longitude'];

const userDoc = (uid: string) => doc(db, 'users', uid);

/** Firestore `users/{uid}` document → the `User` shape the screens use. */
const toUser = (uid: string, data: Record<string, unknown>): User => {
  const email = String(data.email ?? '').trim().toLowerCase();
  const role = (email === 'admin@revivex.lk' || data.role === 'ADMIN') ? 'ADMIN' : ((data.role as UserRole) ?? 'ITEM_OWNER');
  return {
    id: uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    role,
    phone: (data.phone as string | null) ?? null,
    profileImage: (data.profileImage as string | null) ?? null,
    latitude: (data.latitude as number | null) ?? null,
    longitude: (data.longitude as number | null) ?? null,
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
};

const validation = (details: string[]) => new ApiError('Validation failed', 400, 'VALIDATION_ERROR', details);

/** Firebase Auth errors → the same messages the old backend gave. */
const authError = (error: unknown): ApiError => {
  const code = error instanceof FirebaseError ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    case 'auth/email-already-in-use':
      return new ApiError('Email address is already registered', 409, 'EMAIL_TAKEN');
    case 'auth/weak-password':
      return validation(['Password must be at least 8 characters and contain both letters and numbers']);
    case 'auth/too-many-requests':
      return new ApiError('Too many failed login attempts. Try again later.', 429, 'TOO_MANY_ATTEMPTS');
    default:
      return toApiError(error);
  }
};

const currentUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  return uid;
};

const loadProfile = async (uid: string): Promise<User> => {
  const snapshot = await fsCall(() => getDoc(userDoc(uid)));
  if (!snapshot.exists()) throw new ApiError('User not found', 404, 'NOT_FOUND');
  return toUser(uid, snapshot.data());
};

/** Ensure the caller is authenticated as an active ADMIN before sensitive operations. */
const requireAdmin = async (): Promise<User> => {
  const uid = currentUid();
  const caller = await loadProfile(uid);
  if (caller.role !== 'ADMIN' || !caller.isActive) {
    throw new ApiError('Admin authorization required', 403, 'FORBIDDEN');
  }
  return caller;
};

const validateRegister = (data: RegisterData) => {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('Name is required');
  else if (data.name.trim().length > NAME_MAX_LENGTH) errors.push(`Name must be at most ${NAME_MAX_LENGTH} characters`);
  if (!isValidEmail(data.email ?? '')) errors.push('A valid email address is required');
  if (!data.password) errors.push('Password is required');
  else if (!isValidPassword(data.password)) {
    errors.push('Password must be at least 8 characters and contain both letters and numbers');
  }
  if (data.role === 'ADMIN') errors.push('Registration as ADMIN is not allowed through public registration');
  else if (data.role && !PUBLIC_ROLES.includes(data.role)) errors.push(`Role must be one of: ${PUBLIC_ROLES.join(', ')}`);
  if (data.phone && !PHONE_REGEX.test(data.phone.trim())) errors.push('Phone number is invalid');
  if (errors.length) throw validation(errors);
};

export const authService = {
  /** Create the Firebase account and its `users/{uid}` profile. Signs the user in. */
  register: async (data: RegisterData): Promise<AuthResult> => {
    validateRegister(data);
    let uid: string;
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email.trim().toLowerCase(), data.password);
      uid = credential.user.uid;
    } catch (error) {
      throw authError(error);
    }
    const now = nowIso();
    const profile = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role ?? 'ITEM_OWNER',
      phone: data.phone?.trim() || null,
      profileImage: null,
      latitude: null,
      longitude: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await fsCall(() => setDoc(userDoc(uid), profile));
    return { token: uid, user: toUser(uid, profile) };
  },

  /** Sign in; deactivated accounts are signed straight out again. */
  login: async (credentials: LoginCredentials): Promise<AuthResult> => {
    if (!isValidEmail(credentials.email ?? '') || !credentials.password) {
      throw validation(['A valid email and password are required']);
    }
    let uid: string;
    try {
      const credential = await signInWithEmailAndPassword(auth, credentials.email.trim().toLowerCase(), credentials.password);
      uid = credential.user.uid;
    } catch (error) {
      throw authError(error);
    }
    const user = await loadProfile(uid);
    if (!user.isActive) {
      await signOut(auth);
      throw new ApiError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    return { token: uid, user };
  },

  /**
   * Email a password-reset link (sent by Firebase). For privacy the app shows the same
   * message whether or not the email has an account.
   */
  sendPasswordReset: async (email: string): Promise<void> => {
    if (!isValidEmail(email ?? '')) throw validation(['A valid email address is required']);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : '';
      if (code === 'auth/user-not-found') return; // don't reveal which emails are registered
      if (code === 'auth/too-many-requests') {
        throw new ApiError('Too many reset requests. Try again later.', 429, 'TOO_MANY_ATTEMPTS');
      }
      throw authError(error);
    }
  },

  /**
   * Change the signed-in user's password. Firebase asks for the current password again
   * first (re-authentication), so a phone left unlocked can't be used to take over the account.
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
    const errors: string[] = [];
    if (!currentPassword) errors.push('Current password is required');
    if (!isValidPassword(newPassword ?? '')) {
      errors.push('New password must be at least 8 characters and contain both letters and numbers');
    } else if (newPassword === currentPassword) {
      errors.push('New password must be different from the current one');
    }
    if (errors.length) throw validation(errors);

    try {
      await reauthenticateWithCredential(
        firebaseUser,
        EmailAuthProvider.credential(firebaseUser.email, currentPassword)
      );
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        throw new ApiError('Current password is incorrect', 401, 'WRONG_PASSWORD');
      }
      throw authError(error);
    }
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error) {
      throw authError(error);
    }
  },

  logout: async (): Promise<null> => {
    await signOut(auth);
    return null;
  },

  getMe: (): Promise<User> => loadProfile(currentUid()),

  /**
   * Safe public profile query (Member 1 / Privacy - Step 8).
   * Strips out sensitive fields (email, phone, exact coordinates, account activity flags).
   */
  getPublicProfile: async (userId: string): Promise<PublicUser> => {
    const profile = await loadProfile(userId);
    return {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      profileImage: profile.profileImage,
    };
  },

  /** Users may change only their own name, phone, photo and location. */
  updateMe: async (data: UpdateProfileData): Promise<User> => {
    const uid = currentUid();
    const changes: Record<string, unknown> = {};
    for (const field of PROFILE_FIELDS) {
      if (data[field] !== undefined) changes[field] = data[field];
    }
    if (changes.name !== undefined && !String(changes.name).trim()) throw validation(['Name is required']);
    if (typeof changes.phone === 'string' && changes.phone && !PHONE_REGEX.test(changes.phone.trim())) {
      throw validation(['Phone number is invalid']);
    }
    await fsCall(() => updateDoc(userDoc(uid), { ...changes, updatedAt: nowIso() }));
    return loadProfile(uid);
  },
};

export interface AdminUserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}

/** Admin user management (US-37). Security rules and service methods allow these writes only for verified admins. */
export const adminService = {
  listUsers: async (filters: AdminUserFilters = {}): Promise<Paginated<User>> => {
    await requireAdmin();
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const snapshot = await fsCall(() => getDocs(collection(db, 'users')));
    const term = filters.search?.trim().toLowerCase();
    const users = snapshot.docs
      .map((d) => toUser(d.id, d.data()))
      .filter((u) => !filters.role || u.role === filters.role)
      .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      items: users.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
    };
  },

  changeRole: async (userId: string, role: UserRole): Promise<User> => {
    await requireAdmin();
    if (!ALL_ROLES.includes(role)) throw validation(['A valid role is required']);
    if (userId === currentUid()) throw new ApiError('Admins cannot change their own role', 400, 'SELF_MODIFICATION');
    await fsCall(() => updateDoc(userDoc(userId), { role, updatedAt: nowIso() }));
    return loadProfile(userId);
  },

  setActive: async (userId: string, isActive: boolean): Promise<User> => {
    await requireAdmin();
    if (userId === currentUid()) {
      throw new ApiError('Admins cannot deactivate their own account', 400, 'SELF_MODIFICATION');
    }
    await fsCall(() => updateDoc(userDoc(userId), { isActive, updatedAt: nowIso() }));
    return loadProfile(userId);
  },
};
