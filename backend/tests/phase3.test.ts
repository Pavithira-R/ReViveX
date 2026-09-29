// ============================================================================
// Member 4 - Phase 3 Test Suite (Quotation & Provider Response)
// ============================================================================

import { repairRequestService } from '../src/services/repairRequestService';
import { validateProviderResponse } from '../src/validators/quotationValidator';
import { RepairStatus } from '../src/types';

async function runPhase3Tests() {
  console.log('=== RUNNING PHASE 3 TESTS: Quotation & Provider Response ===\n');
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

  // Test 1: Validate positive quotation input
  const validAccept = validateProviderResponse({
    action: 'ACCEPT',
    estimatedPrice: 75.0,
    providerNotes: 'Includes diagnostic fee and new thermal paste.',
  });
  assert(validAccept.isValid && validAccept.errors.length === 0, 'Valid ACCEPT response passes validator');

  // Test 2: Validate zero quotation (free diagnosis / warranty service)
  const zeroQuote = validateProviderResponse({
    action: 'ACCEPT',
    estimatedPrice: 0,
    providerNotes: 'Free evaluation under warranty.',
  });
  assert(zeroQuote.isValid && zeroQuote.errors.length === 0, 'Zero dollar quotation passes validator');

  // Test 3: Reject negative quotation
  const negativeQuote = validateProviderResponse({
    action: 'ACCEPT',
    estimatedPrice: -25.0,
  });
  assert(!negativeQuote.isValid && negativeQuote.errors.some(e => e.includes('negative')), 'Negative quotation is rejected');

  // Test 4: Reject ACCEPT without estimated price
  const missingPrice = validateProviderResponse({
    action: 'ACCEPT',
  });
  assert(!missingPrice.isValid && missingPrice.errors.some(e => e.includes('quotation is required')), 'ACCEPT without price is rejected');

  // Test 5: Validate REJECT with reason
  const validReject = validateProviderResponse({
    action: 'REJECT',
    rejectionReason: 'Replacement parts obsolete and no longer obtainable.',
  });
  assert(validReject.isValid, 'Valid REJECT with reason passes validator');

  // Test 6: Reject REJECT without reason
  const missingReason = validateProviderResponse({
    action: 'REJECT',
    rejectionReason: '',
  });
  assert(!missingReason.isValid && missingReason.errors.some(e => e.includes('reason')), 'REJECT without reason is rejected');

  // Test 7: Provider successfully accepts request with quotation
  try {
    // Create fresh request first
    const newReq = await repairRequestService.createRepairRequest({
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'MacBook Pro screen backlight flickering intermittently.',
      preferredDate: '2025-04-20T10:00:00.000Z',
    });

    const accepted = await repairRequestService.respondToRequest(newReq.id, {
      action: 'ACCEPT',
      estimatedPrice: 85.0,
      providerNotes: 'Will inspect display flex cable.',
    });

    assert(accepted.status === RepairStatus.ACCEPTED, 'Request status transitions to ACCEPTED');
    assert(accepted.estimatedPrice === 85.0, 'Estimated quotation price is saved');
    assert(accepted.providerNotes?.includes('flex cable'), 'Provider notes are saved');
  } catch (err: any) {
    assert(false, `Accept request threw error: ${err.message}`);
  }

  // Test 8: Provider rejects request
  try {
    const newReq2 = await repairRequestService.createRepairRequest({
      itemId: 'item_phone_002',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'Water damage from ocean exposure 3 weeks ago.',
      preferredDate: '2025-04-22T10:00:00.000Z',
    });

    const rejected = await repairRequestService.respondToRequest(newReq2.id, {
      action: 'REJECT',
      rejectionReason: 'Corrosion is too severe for repair.',
    });

    assert(rejected.status === RepairStatus.REJECTED, 'Request status transitions to REJECTED');
    assert(rejected.rejectionReason === 'Corrosion is too severe for repair.', 'Rejection reason is saved');
  } catch (err: any) {
    assert(false, `Reject request threw error: ${err.message}`);
  }

  // Test 9: Reject responding to already accepted / invalid transition request
  try {
    const newReq3 = await repairRequestService.createRepairRequest({
      itemId: 'item_phone_002',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'Speaker distortion on calls.',
      preferredDate: '2025-04-25T10:00:00.000Z',
    });

    await repairRequestService.respondToRequest(newReq3.id, {
      action: 'ACCEPT',
      estimatedPrice: 40.0,
    });

    // Try accepting again
    await repairRequestService.respondToRequest(newReq3.id, {
      action: 'ACCEPT',
      estimatedPrice: 50.0,
    });
    assert(false, 'Expected second response on already ACCEPTED request to throw error');
  } catch (err: any) {
    assert(err.message.includes('Cannot respond'), 'Cannot respond to request already in ACCEPTED status');
  }

  // Test 10: Missing request ID rejection
  try {
    await repairRequestService.respondToRequest('req_non_existent_9999', {
      action: 'ACCEPT',
      estimatedPrice: 50.0,
    });
    assert(false, 'Expected missing request to throw error');
  } catch (err: any) {
    assert(err.message.includes('not found'), 'Rejects response to nonexistent request ID');
  }

  console.log(`\n=== PHASE 3 TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
