import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils';

/**
 * 404 handler for unknown API routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', [], 404);
};

/**
 * Global error handler. Produces the standard response envelope and never
 * leaks internal messages or stack traces for unexpected (500) errors.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.details ?? [], err.statusCode);
    return;
  }

  // Malformed JSON body sent by the client
  const maybeHttpError = err as { type?: string; status?: number };
  if (maybeHttpError?.type === 'entity.parse.failed') {
    sendError(res, 'Request body contains invalid JSON', 'INVALID_JSON', [], 400);
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Handler]', err);
  }
  sendError(res, 'Internal server error', 'SERVER_ERROR', [], 500);
};
