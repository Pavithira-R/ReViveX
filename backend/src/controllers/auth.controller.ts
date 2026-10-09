import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { sendSuccess } from '../utils';

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
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, 'Login successful', result);
    } catch (error) {
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
