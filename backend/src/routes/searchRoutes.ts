// ============================================================================
// Member 3 - Search Routes
// ============================================================================

import { Router } from 'express';
import { searchController } from '../controllers/searchController';

const router = Router();

// GET /api/search - Unified cross-domain search and filtering
router.get('/', (req, res) => searchController.search(req, res));

export default router;
