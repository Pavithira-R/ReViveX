import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { CreateReviewDto } from '../types/review.types';

export class ReviewController {
  /**
   * POST /api/reviews
   * Submits a new review
   */
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateReviewDto = req.body;
      const reviewerId = req.user?.id || req.body.reviewerId || 'mock-dev-reviewer-id';

      const createdReview = await reviewService.createReview(dto, reviewerId);

      sendSuccess(
        res,
        'Review submitted successfully',
        createdReview,
        201
      );
    } catch (error: any) {
      console.error('Error creating review:', error);
      sendError(
        res,
        'Internal server error while submitting review',
        'SERVER_ERROR',
        [error?.message || 'Unexpected server error'],
        500
      );
    }
  }

  /**
   * GET /api/providers/:id/reviews
   * Retrieves all reviews and rating breakdown for a service provider
   */
  async getProviderReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || id.trim() === '') {
        sendError(
          res,
          'Provider ID is required',
          'VALIDATION_ERROR',
          ['Missing :id parameter in URL path'],
          400
        );
        return;
      }

      const reviewsSummary = await reviewService.getProviderReviews(id);

      sendSuccess(
        res,
        'Provider reviews retrieved successfully',
        reviewsSummary,
        200
      );
    } catch (error: any) {
      console.error('Error fetching provider reviews:', error);
      sendError(
        res,
        'Internal server error while fetching reviews',
        'SERVER_ERROR',
        [error?.message || 'Unexpected server error'],
        500
      );
    }
  }
}

export const reviewController = new ReviewController();
