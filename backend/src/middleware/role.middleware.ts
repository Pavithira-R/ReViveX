import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { sendError } from '../utils';

/**
 * Role-based authorization. Must be placed after `authenticate`.
 * Usage: requireRole('ADMIN') or requireRole('SERVICE_PROVIDER', 'RECYCLER')
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 'UNAUTHORIZED', [], 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'Access forbidden: insufficient role permissions',
        'FORBIDDEN',
        [],
        403
      );
      return;
    }

    next();
  };
};
