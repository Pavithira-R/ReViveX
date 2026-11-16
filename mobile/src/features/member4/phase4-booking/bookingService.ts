// ============================================================================
// Phase 4 - Client Booking Service
// ============================================================================

import { Booking, BookingStatus, ApiResponse } from '../types';
import { CreateBookingFormData } from './types';
import { repairService } from '../repair.service';

export class MobileBookingService {
  async createBooking(data: CreateBookingFormData): Promise<ApiResponse<Booking>> {
    return repairService.createBooking({
      repairRequestId: data.repairRequestId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      notes: data.notes,
    });
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    const booking: Booking = {
      id,
      repairRequestId: '',
      customerId: '',
      providerId: '',
      appointmentDate: new Date().toISOString(),
      status: BookingStatus.CONFIRMED,
      confirmationCode: 'REV-BK-CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return {
      success: true,
      statusCode: 200,
      data: booking,
    };
  }
}

export const mobileBookingService = new MobileBookingService();
