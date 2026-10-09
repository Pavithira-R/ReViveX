import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { sendSuccess } from '../utils';
import { UserListQuery } from '../types';

export class UserController {
  /**
   * GET /api/users/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getOwnProfile(req.user!.id);
      sendSuccess(res, 'Profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me
   */
  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateOwnProfile(req.user!.id, req.body);
      sendSuccess(res, 'Profile updated successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id  (public profile of another user)
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getPublicProfile(req.params.id);
      sendSuccess(res, 'User retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  // ---------------- Admin ----------------

  /**
   * GET /api/admin/users?role=&search=&isActive=&page=&limit=
   */
  async adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.listUsers(req.query as UserListQuery);
      sendSuccess(res, 'Users retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async adminGet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, 'User retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/role   body: { role }
   */
  async adminChangeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.changeRole(req.user!.id, req.params.id, req.body?.role);
      sendSuccess(res, 'User role updated', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status   body: { isActive }
   */
  async adminSetStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.setActive(req.user!.id, req.params.id, req.body?.isActive);
      sendSuccess(
        res,
        user.isActive ? 'User account activated' : 'User account deactivated',
        user
      );
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
