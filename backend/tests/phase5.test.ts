// ============================================================================
// Member 4 - Phase 5 Test Suite (Repair Status Tracking)
// ============================================================================

import { repairRequestService } from '../src/services/repairRequestService';
import { statusTransitionService } from '../src/services/statusTransitionService';
import { validateUpdateRepairStatus } from '../src/validators/repairRequestValidator';
import { RepairStatus } from '../src/types';

async function runPhase5Tests() {
  console.log('=== RUNNING PHASE 5 TESTS: Repair Status Tracking ===\n');
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

  // Test 1: Validate lifecycle transition state machine rules
  const validAdvance1 = statusTransitionService.validateTransition(RepairStatus.POSTED, RepairStatus.ACCEPTED);
  assert(validAdvance1.allowed, 'Allows POSTED -> ACCEPTED transition');

  const validAdvance2 = statusTransitionService.validateTransition(RepairStatus.ACCEPTED, RepairStatus.IN_PROGRESS);
  assert(validAdvance2.allowed, 'Allows ACCEPTED -> IN_PROGRESS transition');

  const validAdvance3 = statusTransitionService.validateTransition(RepairStatus.IN_PROGRESS, RepairStatus.COMPLETED);
  assert(validAdvance3.allowed, 'Allows IN_PROGRESS -> COMPLETED transition');

  // Test 2: Reject invalid backwards transition from COMPLETED
  const invalidReopen = statusTransitionService.validateTransition(RepairStatus.COMPLETED, RepairStatus.IN_PROGRESS);
  assert(!invalidReopen.allowed && Boolean(invalidReopen.error), 'Rejects COMPLETED -> IN_PROGRESS reopen transition');

  // Test 3: Reject skipping steps (e.g., POSTED directly to COMPLETED)
  const invalidSkip = statusTransitionService.validateTransition(RepairStatus.POSTED, RepairStatus.COMPLETED);
  assert(!invalidSkip.allowed, 'Rejects skipping directly from POSTED -> COMPLETED');

  // Test 4: End-to-end status progression through service
  try {
    const freshReq = await repairRequestService.createRepairRequest({
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'Fan noise and thermal throttling test.',
      preferredDate: '2025-06-01T10:00:00.000Z',
    });

    // Advance to ACCEPTED
    const accepted = await repairRequestService.respondToRequest(freshReq.id, {
      action: 'ACCEPT',
      estimatedPrice: 55.0,
      providerNotes: 'Ready to service fans.',
    });
    assert(accepted.status === RepairStatus.ACCEPTED, 'Status is ACCEPTED');

    // Advance to IN_PROGRESS
    const inProgressResult = await repairRequestService.updateRepairStatus(
      freshReq.id,
      RepairStatus.IN_PROGRESS,
      'Disassembling device and cleaning thermal heatsink.'
    );
    assert(inProgressResult.request.status === RepairStatus.IN_PROGRESS, 'Status transitioned to IN_PROGRESS');
    assert(inProgressResult.request.providerNotes?.includes('Disassembling'), 'Notes updated');

    // Advance to COMPLETED
    const completedResult = await repairRequestService.updateRepairStatus(
      freshReq.id,
      RepairStatus.COMPLETED,
      'Thermals verified. Device running 15C cooler under load.'
    );
    assert(completedResult.request.status === RepairStatus.COMPLETED, 'Status transitioned to COMPLETED');
    assert(Boolean(completedResult.hookResult), 'Member 6 integration hook was triggered');
    assert(completedResult.hookResult?.status === 'HANDLED_HOOK', 'Member 6 hook returned valid handled payload');
    assert(completedResult.hookResult?.eWasteKgDivertedEstimate > 0, 'Eco impact e-waste metric calculated');
  } catch (err: any) {
    assert(false, `Status progression threw error: ${err.message}`);
  }

  // Test 5: Reopening completed repair throws error
  try {
    const seedReq = await repairRequestService.getRequestById('req_rep_101');
    if (seedReq) {
      // Advance to IN_PROGRESS then COMPLETED
      await repairRequestService.updateRepairStatus(seedReq.id, RepairStatus.IN_PROGRESS);
      await repairRequestService.updateRepairStatus(seedReq.id, RepairStatus.COMPLETED);

      // Attempt to move back to IN_PROGRESS
      await repairRequestService.updateRepairStatus(seedReq.id, RepairStatus.IN_PROGRESS);
      assert(false, 'Expected reopen to fail');
    }
  } catch (err: any) {
    assert(err.message.includes('Invalid status transition'), 'Prevents modifying completed repair');
  }

  // Test 6: Validate status input validator
  const validStatus = validateUpdateRepairStatus('IN_PROGRESS');
  assert(validStatus.isValid, 'Valid status enum string passes validator');

  const invalidStatus = validateUpdateRepairStatus('UNKNOWN_STATUS');
  assert(!invalidStatus.isValid, 'Invalid status enum string is rejected');

  console.log(`\n=== PHASE 5 TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests();
