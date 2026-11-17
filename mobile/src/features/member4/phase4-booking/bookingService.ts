// ============================================================================
// Phase 4 - Client Booking Service
// ============================================================================

import { Booking, ApiResponse } from '../types';
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
    // DATA INTEGRITY (Step 4.5 & 4.6): Query the actual persisted booking from Firestore
    return repairService.getBooking(id);
  }
}

export const mobileBookingService = new MobileBookingService();
