// ============================================================================
// Member 4 - Phase 4 Test Suite (Booking / Appointment)
// ============================================================================

import { bookingService } from '../src/services/bookingService';
import { repairRequestService } from '../src/services/repairRequestService';
import { validateCreateBooking, validateUpdateBookingStatus } from '../src/validators/bookingValidator';
import { BookingStatus } from '../src/types';

async function runPhase4Tests() {
  console.log('=== RUNNING PHASE 4 TESTS: Booking / Appointment ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  };

  // Test 1: Valid booking creation
  try {
    const freshReq = await repairRequestService.createRepairRequest({
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'MacBook trackpad replacement after liquid spill.',
      preferredDate: '2025-05-01T10:00:00.000Z',
    });

    const bookingPayload = {
      repairRequestId: freshReq.id,
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      appointmentDate: '2025-05-05T14:00:00.000Z',
      appointmentTime: '02:00 PM',
      notes: 'Customer dropping off in person.',
    };

    const validation = validateCreateBooking(bookingPayload);
    assert(validation.isValid && validation.errors.length === 0, 'Valid booking payload passes validator');

    const createdBooking = await bookingService.createBooking(bookingPayload);
    assert(Boolean(createdBooking.id), 'Booking has generated ID');
    assert(createdBooking.confirmationCode.startsWith('REV-BK-'), 'Booking has standard confirmation code');
    assert(createdBooking.status === BookingStatus.CONFIRMED, 'Booking is created with CONFIRMED status');
    assert(createdBooking.appointmentTime === '02:00 PM', 'Booking time matches');
  } catch (err: any) {
    assert(false, `Booking creation failed with error: ${err.message}`);
  }

  // Test 2: Reject missing repairRequestId
  const missingReq = validateCreateBooking({
    repairRequestId: '',
    customerId: 'usr_cust_001',
    providerId: 'prov_fixit_001',
    appointmentDate: '2025-05-05T14:00:00.000Z',
    appointmentTime: '02:00 PM',
  });
  assert(!missingReq.isValid && missingReq.errors.some(e => e.includes('Repair Request ID')), 'Rejects missing repairRequestId');

  // Test 3: Reject nonexistent repair request in service layer
  try {
    await bookingService.createBooking({
      repairRequestId: 'req_non_existent_9999',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      appointmentDate: '2025-05-05T14:00:00.000Z',
      appointmentTime: '02:00 PM',
    });
    assert(false, 'Expected nonexistent repair request to fail');
  } catch (err: any) {
    assert(err.message.includes('does not exist'), 'Rejects booking for nonexistent repair request');
  }

  // Test 4: Reject invalid appointment date
  const invalidDate = validateCreateBooking({
    repairRequestId: 'req_rep_101',
    customerId: 'usr_cust_001',
    providerId: 'prov_fixit_001',
    appointmentDate: 'invalid-date-string',
    appointmentTime: '02:00 PM',
  });
  assert(!invalidDate.isValid && invalidDate.errors.some(e => e.includes('valid ISO date')), 'Rejects invalid date format');

  // Test 5: Prevent duplicate booking on same repair request
  try {
    const dupReq = await repairRequestService.createRepairRequest({
      itemId: 'item_phone_002',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'iPhone camera glass lens replacement.',
      preferredDate: '2025-05-10T10:00:00.000Z',
    });

    await bookingService.createBooking({
      repairRequestId: dupReq.id,
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      appointmentDate: '2025-05-12T10:00:00.000Z',
      appointmentTime: '10:00 AM',
    });

    // Attempt second booking on the same request
    await bookingService.createBooking({
      repairRequestId: dupReq.id,
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      appointmentDate: '2025-05-13T10:00:00.000Z',
      appointmentTime: '11:00 AM',
    });
    assert(false, 'Expected duplicate booking to be prevented');
  } catch (err: any) {
    assert(err.message.includes('already exists'), 'Prevents duplicate booking on the same repair request');
  }

  // Test 6: Update booking status
  try {
    const updated = await bookingService.updateBookingStatus('book_rep_501', BookingStatus.COMPLETED);
    assert(updated.status === BookingStatus.COMPLETED, 'Successfully updates booking status to COMPLETED');
  } catch (err: any) {
    assert(false, `Update booking status threw error: ${err.message}`);
  }

  // Test 7: Validate invalid booking status
  const invalidStatus = validateUpdateBookingStatus('INVALID_STATUS_NAME');
  assert(!invalidStatus.isValid && invalidStatus.errors.some(e => e.includes('Invalid booking status')), 'Rejects unrecognized booking status');

  console.log(`\n=== PHASE 4 TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
