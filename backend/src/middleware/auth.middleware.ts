import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication Middleware for Member 6 Review Module
 * Supports production JWT handling (when Member 1 finishes auth)
 * and an explicit isolated fallback for local testing/development.
 */
export const extractUser = (req: Request, res: Response, next: NextFunction): void => {
  // 1. If Member 1's auth middleware has already attached user
  if (req.user && req.user.id) {
    return next();
  }

  // 2. Check for Bearer token placeholder (Member 1 integration contract)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // In production, Member 1 will verify the JWT token
    // For Phase 1, parse basic token if provided
    if (token && token.length > 5) {
      req.user = { id: `user-${token.substring(0, 8)}` };
      return next();
    }
  }

  // 3. Isolated Local/Mock Development Fallback
  // Allows testing without hardcoding IDs into production logic
  const mockUserIdHeader = req.headers['x-mock-user-id'] as string;
  const mockUserIdBody = req.body?.reviewerId as string;

  if (process.env.NODE_ENV !== 'production') {
    if (mockUserIdHeader) {
      req.user = { id: mockUserIdHeader };
      return next();
    }
    if (mockUserIdBody) {
      req.user = { id: mockUserIdBody };
      return next();
    }
    // Default development fallback identifier
    req.user = { id: 'mock-dev-reviewer-id' };
  }

  next();
};
