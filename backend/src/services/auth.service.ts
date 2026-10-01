import { Prisma, Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { RegisterDTO, LoginDTO, AuthResult, UserRole } from '../types';
import {
  hashPassword,
  comparePassword,
  generateToken,
  validateRegisterInput,
  validateLoginInput,
  normalizeEmail,
  toSafeUser,
  AppError,
  validationError,
} from '../utils';

const issueAuthResult = (user: Parameters<typeof toSafeUser>[0]): AuthResult => ({
  token: generateToken({
    id: user.id,
    role: user.role as UserRole,
    email: user.email,
    name: user.name,
  }),
  user: toSafeUser(user),
});

export class AuthService {
  /**
   * Register a new user. Returns a token so the app can sign the user in immediately.
   */
  async register(input: RegisterDTO): Promise<AuthResult> {
    const validation = validateRegisterInput(input ?? {});
    if (!validation.isValid) {
      throw validationError(validation.errors);
    }

    const email = normalizeEmail(input.email);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email address is already registered', 409, 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          role: (input.role as Role) || Role.ITEM_OWNER,
          phone: input.phone?.trim() || null,
        },
      });
      return issueAuthResult(user);
    } catch (error) {
      // Two simultaneous registrations with the same email
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Email address is already registered', 409, 'EMAIL_TAKEN');
      }
      throw error;
    }
  }

  /**
   * Authenticate a user and issue a JWT.
   */
  async login(input: LoginDTO): Promise<AuthResult> {
    const validation = validateLoginInput(input ?? {});
    if (!validation.isValid) {
      throw validationError(validation.errors);
    }

    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });

    // Same message for unknown email and wrong password so accounts can't be enumerated.
    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    return issueAuthResult(user);
  }
}

export const authService = new AuthService();
