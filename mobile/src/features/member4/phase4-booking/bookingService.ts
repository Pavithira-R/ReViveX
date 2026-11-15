// ============================================================================
// Phase 4 - Client Booking Service
// ============================================================================

import { Booking, BookingStatus, ApiResponse, RepairRequest } from '../../../types';
import { CreateBookingFormData } from './types';

export class MobileBookingService {
  private inMemoryBookings: Booking[] = [];

  async createBooking(data: CreateBookingFormData): Promise<ApiResponse<Booking>> {
    try {
      if (!data.repairRequestId) {
        return { success: false, statusCode: 400, error: 'A valid Repair Request is required' };
      }
      if (!data.appointmentDate) {
        return { success: false, statusCode: 400, error: 'Please choose an appointment date' };
      }
      if (!data.appointmentTime) {
        return { success: false, statusCode: 400, error: 'Please choose an appointment time' };
      }

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const confirmationCode = `REV-BK-${randomCode}`;
      const now = new Date().toISOString();

      const booking: Booking = {
        id: `book_rep_${Date.now()}`,
        repairRequestId: data.repairRequestId,
        customerId: data.customerId,
        providerId: data.providerId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        status: BookingStatus.CONFIRMED,
        notes: data.notes,
        confirmationCode,
        createdAt: now,
        updatedAt: now,
      };

      this.inMemoryBookings.push(booking);

      return {
        success: true,
        statusCode: 201,
        data: booking,
        message: 'Appointment booking confirmed!',
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Error booking appointment',
      };
    }
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    const found = this.inMemoryBookings.find((b) => b.id === id);
    if (!found) {
      return { success: false, statusCode: 404, error: 'Booking not found' };
    }
    return { success: true, statusCode: 200, data: found };
  }
}

export const mobileBookingService = new MobileBookingService();
