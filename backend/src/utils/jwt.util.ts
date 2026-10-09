import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser, TokenClaims } from '../types';

const DEV_FALLBACK_SECRET = 'revivex_dev_only_secret_do_not_use_in_production';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

/**
 * Generate a signed JWT for the authenticated user.
 */
export const generateToken = (user: AuthUser): string => {
  const claims: TokenClaims = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  const options: SignOptions = {
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
  };
  return jwt.sign(claims, getJwtSecret(), options);
};

/**
 * Verify and decode a JWT.
 * Throws jwt.TokenExpiredError / jwt.JsonWebTokenError if invalid.
 */
export const verifyToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, getJwtSecret()) as TokenClaims;
  if (!decoded || typeof decoded.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Token is missing subject');
  }
  return {
    id: decoded.sub,
    role: decoded.role,
    email: decoded.email,
    name: decoded.name,
  };
};
