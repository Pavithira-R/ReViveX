import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import {
  AppError,
  clearFailedLogins,
  getLoginLockRemainingMs,
  loginAttemptKey,
  recordFailedLogin,
  sendSuccess,
} from '../utils';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, 'User registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Too many wrong passwords for one email from one IP locks login for a while.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const attemptKey = loginAttemptKey(req.ip, req.body?.email);

    const lockRemainingMs = getLoginLockRemainingMs(attemptKey);
    if (lockRemainingMs > 0) {
      const minutes = Math.ceil(lockRemainingMs / 60000);
      res.setHeader('Retry-After', Math.ceil(lockRemainingMs / 1000));
      next(
        new AppError(
          `Too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
          429,
          'TOO_MANY_ATTEMPTS'
        )
      );
      return;
    }

    try {
      const result = await authService.login(req.body);
      clearFailedLogins(attemptKey);
      sendSuccess(res, 'Login successful', result);
    } catch (error) {
      if (error instanceof AppError && error.code === 'INVALID_CREDENTIALS') {
        recordFailedLogin(attemptKey);
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * JWT is stateless; the client discards its token. Endpoint exists so the
   * app has a single place to hook future token revocation.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, 'Logout successful. Remove the token on the client.', null);
  }
}

export const authController = new AuthController();
