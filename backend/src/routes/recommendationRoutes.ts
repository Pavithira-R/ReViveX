// ============================================================================
// Member 3 - Recommendation Routes
// ============================================================================

import { Router } from 'express';
import { recommendationController } from '../controllers/recommendationController';

const router = Router();

// POST /api/recommendations/evaluate - Evaluate recommendation questionnaire inputs
router.post('/evaluate', (req, res) => recommendationController.evaluate(req, res));

export default router;
