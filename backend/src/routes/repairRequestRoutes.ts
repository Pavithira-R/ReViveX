// ============================================================================
// Member 4 - Repair Request Routes (Phase 2)
// ============================================================================

import { Router } from 'express';
import { repairRequestController } from '../controllers/repairRequestController';

const router = Router();

// POST /api/repair-requests - Create a new repair request
router.post('/', (req, res) => repairRequestController.createRequest(req, res));

// GET /api/repair-requests - List repair requests (filter by customerId or providerId)
router.get('/', (req, res) => repairRequestController.getRequests(req, res));

// GET /api/repair-requests/:id - Get specific repair request
router.get('/:id', (req, res) => repairRequestController.getRequestById(req, res));

// PATCH /api/repair-requests/:id/respond - Provider Accept/Reject with quotation (Phase 3)
router.patch('/:id/respond', (req, res) => repairRequestController.respondToRequest(req, res));

export default router;
