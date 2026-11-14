/**
 * Error with an HTTP status and machine-readable code.
 * Throw from services; the global error handler turns it into the standard response.
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: string[];

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = 'BAD_REQUEST',
    details?: string[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const validationError = (details: string[]): AppError =>
  new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
