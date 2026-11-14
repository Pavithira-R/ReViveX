import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, sendError } from '../utils';
import prisma from '../utils/prisma';
import { UserRole } from '../types';

/**
 * Authentication middleware.
 * Verifies the `Authorization: Bearer <token>` header, confirms the account still
 * exists and is active, and attaches `req.user = { id, role, email, name }`.
 *
 * Usage in any module:
 *   router.get('/something', authenticate, controller.handler)
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    sendError(res, 'Authentication token required', 'UNAUTHORIZED', [], 401);
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    sendError(
      res,
      'Invalid authentication token format. Use: Bearer <token>',
      'UNAUTHORIZED',
      [],
      401
    );
    return;
  }

  let tokenUser;
  try {
    tokenUser = verifyToken(token);
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? 'Authentication token has expired'
        : 'Invalid authentication token';
    sendError(res, message, 'UNAUTHORIZED', [], 401);
    return;
  }

  try {
    // Re-read the user so role changes and deactivation take effect immediately.
    const user = await prisma.user.findUnique({ where: { id: tokenUser.id } });
    if (!user) {
      sendError(res, 'Account no longer exists', 'UNAUTHORIZED', [], 401);
      return;
    }
    if (!user.isActive) {
      sendError(res, 'Account has been deactivated', 'ACCOUNT_DEACTIVATED', [], 403);
      return;
    }

    req.user = {
      id: user.id,
      role: user.role as UserRole,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    next(error);
  }
};

/** @deprecated Use `authenticate`. Kept so existing imports keep working. */
export const authenticateToken = authenticate;
