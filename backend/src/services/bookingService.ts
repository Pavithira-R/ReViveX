// ============================================================================
// Member 4 - Booking Service (Phase 4)
// ============================================================================

import { Booking, BookingStatus, RepairStatus } from '../types';
import { CreateBookingInput } from '../validators/bookingValidator';
import { repairRequestService } from './repairRequestService';

export class BookingService {
  private bookings: Booking[] = [
    {
      id: 'book_rep_501',
      repairRequestId: 'req_rep_101',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      appointmentDate: '2025-03-28T10:00:00.000Z',
      appointmentTime: '10:00 AM',
      status: BookingStatus.CONFIRMED,
      notes: 'Customer will drop off the MacBook at the workshop.',
      confirmationCode: 'REV-BK-8921',
      createdAt: '2025-03-21T14:00:00.000Z',
      updatedAt: '2025-03-21T14:00:00.000Z',
      repairRequestSummary: {
        problemDescription: 'MacBook Pro battery swelling and shuts down below 40% battery charge.',
        estimatedPrice: 85.0,
        status: RepairStatus.ACCEPTED,
      },
    },
  ];

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    // 1. Verify that the repair request exists
    const request = await repairRequestService.getRequestById(input.repairRequestId);
    if (!request) {
      throw new Error(`Repair Request '${input.repairRequestId}' does not exist.`);
    }

    // 2. Prevent duplicate active booking for the same repair request
    const existing = this.bookings.find(
      (b) =>
        b.repairRequestId === input.repairRequestId &&
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING)
    );
    if (existing) {
      throw new Error(
        `An active booking (${existing.confirmationCode}) already exists for this repair request.`
      );
    }

    // 3. Generate confirmation code and booking entity
    const id = `book_rep_${Date.now()}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const confirmationCode = `REV-BK-${randomCode}`;
    const now = new Date().toISOString();

    const booking: Booking = {
      id,
      repairRequestId: input.repairRequestId,
      customerId: input.customerId,
      providerId: input.providerId,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      status: BookingStatus.CONFIRMED,
      notes: input.notes,
      confirmationCode,
      createdAt: now,
      updatedAt: now,
      repairRequestSummary: {
        problemDescription: request.problemDescription,
        estimatedPrice: request.estimatedPrice,
        status: request.status,
      },
    };

    this.bookings.push(booking);
    return booking;
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.customerId === customerId);
  }

  async getBookingsByProvider(providerId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.providerId === providerId);
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw new Error(`Booking '${id}' was not found.`);
    }

    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    return booking;
  }
}

export const bookingService = new BookingService();
