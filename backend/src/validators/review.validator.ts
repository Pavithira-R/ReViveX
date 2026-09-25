import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateReviewInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // 1. Rating validation
  if (data.rating === undefined || data.rating === null || data.rating === '') {
    errors.push('Rating is required.');
  } else {
    const ratingNum = Number(data.rating);
    if (isNaN(ratingNum)) {
      errors.push('Rating must be a valid number.');
    } else if (!Number.isInteger(ratingNum)) {
      errors.push('Rating must be an integer.');
    } else if (ratingNum < 1 || ratingNum > 5) {
      errors.push('Rating must be between 1 and 5 stars.');
    }
  }

  // 2. Comment validation (Optional)
  if (data.comment !== undefined && data.comment !== null) {
    if (typeof data.comment !== 'string') {
      errors.push('Comment must be a text string.');
    } else if (data.comment.length > 1000) {
      errors.push('Comment cannot exceed 1000 characters.');
    }
  }

  // 3. Target entity validation
  // Review must target at least a provider, a user, a repair request, or an item
  const hasTarget = Boolean(
    data.providerId ||
    data.targetUserId ||
    data.repairRequestId ||
    data.itemId
  );

  if (!hasTarget) {
    errors.push('Review target information is required (providerId, targetUserId, repairRequestId, or itemId).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Express middleware for review validation
 */
export const reviewValidator = (req: Request, res: Response, next: NextFunction): void => {
  const validation = validateReviewInput(req.body);

  if (!validation.isValid) {
    sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      validation.errors,
      400
    );
    return;
  }

  next();
};
