// ============================================================================
// Member 4 - Booking Validator (Phase 4)
// ============================================================================

import { BookingStatus } from '../types';

export interface CreateBookingInput {
  repairRequestId: string;
  customerId: string;
  providerId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCreateBooking = (input: Partial<CreateBookingInput>): ValidationResult => {
  const errors: string[] = [];

  if (!input.repairRequestId || typeof input.repairRequestId !== 'string' || input.repairRequestId.trim().length === 0) {
    errors.push('A valid Repair Request ID is required for booking');
  }

  if (!input.providerId || typeof input.providerId !== 'string' || input.providerId.trim().length === 0) {
    errors.push('Provider identification is required');
  }

  if (!input.customerId || typeof input.customerId !== 'string' || input.customerId.trim().length === 0) {
    errors.push('Customer identification is required');
  }

  if (!input.appointmentDate || typeof input.appointmentDate !== 'string') {
    errors.push('Appointment date is required');
  } else {
    const parsedDate = new Date(input.appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Appointment date must be a valid ISO date string');
    }
  }

  if (!input.appointmentTime || typeof input.appointmentTime !== 'string' || input.appointmentTime.trim().length === 0) {
    errors.push('Appointment time is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUpdateBookingStatus = (status: string): ValidationResult => {
  const errors: string[] = [];
  const validStatuses = Object.values(BookingStatus);

  if (!status || !validStatuses.includes(status as BookingStatus)) {
    errors.push(`Invalid booking status. Must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
