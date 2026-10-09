import { Response } from 'express';

/**
 * Standard ReViveX API response envelope (see API Documentation §4).
 * { success, message, data, error }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: {
    code: string;
    details?: string[];
  } | null;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  code: string = 'SERVER_ERROR',
  details: string[] = [],
  statusCode: number = 500
): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    error: {
      code,
      details,
    },
  };
  return res.status(statusCode).json(response);
};
