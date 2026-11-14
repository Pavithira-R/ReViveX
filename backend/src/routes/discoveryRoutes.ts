// ============================================================================
// Member 3 - Discovery Routes
// Router for /api/discovery endpoints
// ============================================================================

import { Router } from 'express';
import { discoveryController } from '../controllers/discoveryController';

const router = Router();

// GET /api/discovery/feed
router.get('/feed', (req, res) => discoveryController.getFeed(req, res));

export default router;
