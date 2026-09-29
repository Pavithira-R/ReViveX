// ============================================================================
// Member 4 - Service Provider Routes (Phase 1)
// ============================================================================

import { Router } from 'express';
import { providerController } from '../controllers/providerController';

const router = Router();

// GET /api/providers - List all providers with optional search / filter
router.get('/', (req, res) => providerController.getProviders(req, res));

// GET /api/providers/:id - Get specific provider details
router.get('/:id', (req, res) => providerController.getProviderById(req, res));

export default router;
