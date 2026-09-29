// ============================================================================
// Member 4 - Booking Routes (Phase 4)
// ============================================================================

import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';

const router = Router();

// POST /api/bookings - Create new booking
router.post('/', (req, res) => bookingController.createBooking(req, res));

// GET /api/bookings/:id - Get booking details
router.get('/:id', (req, res) => bookingController.getBookingById(req, res));

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', (req, res) => bookingController.updateBookingStatus(req, res));

export default router;
