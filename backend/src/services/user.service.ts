import { Prisma, Role } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  SafeUser,
  PublicUser,
  UpdateProfileDTO,
  UserListQuery,
  Paginated,
} from '../types';
import {
  AppError,
  validationError,
  validateProfileUpdate,
  isValidRole,
  toSafeUser,
  toPublicUser,
} from '../utils';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const nullableTrim = (value: string | null | undefined): string | null =>
  value === null || value === undefined || value.trim() === '' ? null : value.trim();

export class UserService {
  /** Profile of the signed-in user (includes private fields). */
  async getOwnProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return toSafeUser(user);
  }

  /** Update the signed-in user's own profile. Role/email/password cannot be changed here. */
  async updateOwnProfile(userId: string, input: UpdateProfileDTO): Promise<SafeUser> {
    const validation = validateProfileUpdate(input ?? {});
    if (!validation.isValid) {
      throw validationError(validation.errors);
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = (input.name as string).trim();
    if (input.phone !== undefined) data.phone = nullableTrim(input.phone);
    if (input.profileImage !== undefined) data.profileImage = nullableTrim(input.profileImage);
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;

    try {
      const user = await prisma.user.update({ where: { id: userId }, data });
      return toSafeUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }
      throw error;
    }
  }

  /** Public view of another user (no email/phone/location). */
  async getPublicProfile(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return toPublicUser(user);
  }

  // ---------------------------------------------------------------
  // Admin user management (US-37)
  // ---------------------------------------------------------------

  async listUsers(query: UserListQuery): Promise<Paginated<SafeUser>> {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

    const where: Prisma.UserWhereInput = {};
    if (query.role !== undefined) {
      if (!isValidRole(query.role)) {
        throw validationError([`Unknown role: ${query.role}`]);
      }
      where.role = query.role as Role;
    }
    if (query.isActive === 'true' || query.isActive === 'false') {
      where.isActive = query.isActive === 'true';
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: users.map(toSafeUser),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string): Promise<SafeUser> {
    return this.getOwnProfile(userId);
  }

  async changeRole(adminId: string, userId: string, role: unknown): Promise<SafeUser> {
    if (!isValidRole(role)) {
      throw validationError(['A valid role is required']);
    }
    if (adminId === userId) {
      throw new AppError('Admins cannot change their own role', 400, 'SELF_MODIFICATION');
    }
    return this.updateAsAdmin(userId, { role: role as Role });
  }

  async setActive(adminId: string, userId: string, isActive: unknown): Promise<SafeUser> {
    if (typeof isActive !== 'boolean') {
      throw validationError(['isActive must be true or false']);
    }
    if (adminId === userId) {
      throw new AppError('Admins cannot deactivate their own account', 400, 'SELF_MODIFICATION');
    }
    return this.updateAsAdmin(userId, { isActive });
  }

  private async updateAsAdmin(userId: string, data: Prisma.UserUpdateInput): Promise<SafeUser> {
    try {
      const user = await prisma.user.update({ where: { id: userId }, data });
      return toSafeUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }
      throw error;
    }
  }
}

export const userService = new UserService();
