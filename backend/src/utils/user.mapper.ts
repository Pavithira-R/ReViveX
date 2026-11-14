import { User } from '@prisma/client';
import { PublicUser, SafeUser, UserRole } from '../types';

/** Strip the password hash before returning a user to its owner or an admin. */
export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as UserRole,
  phone: user.phone,
  profileImage: user.profileImage,
  latitude: user.latitude,
  longitude: user.longitude,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/** Minimal profile shown to other users (e.g. a provider's public page). */
export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  role: user.role as UserRole,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
});
