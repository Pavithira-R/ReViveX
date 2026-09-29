// ============================================================================
// Member 4 - Booking Controller (Phase 4)
// ============================================================================

import { Request, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { validateCreateBooking, validateUpdateBookingStatus } from '../validators/bookingValidator';
import { BookingStatus } from '../types';

export class BookingController {
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateCreateBooking(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const booking = await bookingService.createBooking(req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        data: booking,
        message: 'Appointment booking confirmed successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not exist')
        ? 404
        : error.message.includes('already exists')
        ? 409
        : 500;
      res.status(statusCode).json({
        success: false,
        statusCode,
        error: error.message || 'Failed to create booking',
      });
    }
  }

  async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      if (!booking) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          error: `Booking '${id}' was not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: booking,
        message: 'Booking details retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Failed to retrieve booking',
      });
    }
  }

  async updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validation = validateUpdateBookingStatus(status);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const updated = await bookingService.updateBookingStatus(id, status as BookingStatus);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: updated,
        message: `Booking status updated to ${status}`,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        statusCode,
        error: error.message || 'Failed to update booking status',
      });
    }
  }
}

export const bookingController = new BookingController();
