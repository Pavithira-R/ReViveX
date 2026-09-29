// ============================================================================
// Phase 4 - Repair Booking Types
// ============================================================================

import { Booking, BookingStatus, RepairRequest, ServiceProvider } from '../../../types';

export type { Booking };

export interface CreateBookingFormData {
  repairRequestId: string;
  providerId: string;
  customerId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export interface BookingScreenState {
  repairRequest: RepairRequest | null;
  provider: ServiceProvider | null;
  selectedDate: string;
  selectedTime: string;
  notes: string;
  isSubmitting: boolean;
  error: string | null;
  confirmedBooking: Booking | null;
}
