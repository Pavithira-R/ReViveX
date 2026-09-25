import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { reviewValidator } from '../validators/review.validator';
import { extractUser } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/reviews
 * @desc    Submit a rating and optional review comment
 * @access  Protected / Semi-mock for development
 */
router.post('/reviews', extractUser, reviewValidator, (req, res) => {
  reviewController.createReview(req, res);
});

/**
 * @route   GET /api/providers/:id/reviews
 * @desc    Retrieve reviews and rating summary for a provider
 * @access  Public
 */
router.get('/providers/:id/reviews', (req, res) => {
  reviewController.getProviderReviews(req, res);
});

export default router;
