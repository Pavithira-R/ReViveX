// ============================================================================
// Member 4 - Phase 2 Test Suite (Repair Request Creation)
// ============================================================================

import { repairRequestService } from '../src/services/repairRequestService';
import { validateCreateRepairRequest } from '../src/validators/repairRequestValidator';
import { RepairStatus } from '../src/types';

async function runPhase2Tests() {
  console.log('=== RUNNING PHASE 2 TESTS: Repair Request Creation ===\n');
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

  // Test 1: Valid repair request creation
  try {
    const validPayload = {
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'Trackpad gesture recognition is not responding and clicks are stuck.',
      preferredDate: '2025-04-15T09:00:00.000Z',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      notes: 'I will drop off the laptop in person.',
    };

    const validation = validateCreateRepairRequest(validPayload);
    assert(validation.isValid && validation.errors.length === 0, 'Valid payload passes validator');

    const created = await repairRequestService.createRepairRequest(validPayload);
    assert(Boolean(created.id), 'Created repair request has a generated ID');
    assert(created.status === RepairStatus.POSTED, 'New request initial status is POSTED');
    assert(created.itemSummary?.title === 'MacBook Pro 15" (2019)', 'Item summary is populated from Member 2 adapter');
    assert(created.providerSummary?.businessName === 'FixIt Pro Electronics', 'Provider summary is populated');
  } catch (err: any) {
    assert(false, `Valid request creation failed with error: ${err.message}`);
  }

  // Test 2: Reject missing provider
  const missingProvider = validateCreateRepairRequest({
    itemId: 'item_laptop_001',
    customerId: 'usr_cust_001',
    providerId: '',
    problemDescription: 'Screen flickering with green lines across panel.',
    preferredDate: '2025-04-15T09:00:00.000Z',
  });
  assert(!missingProvider.isValid && missingProvider.errors.some(e => e.includes('Provider')), 'Rejects missing provider ID');

  // Test 3: Reject nonexistent provider in service layer
  try {
    await repairRequestService.createRepairRequest({
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_nonexistent_999',
      problemDescription: 'Screen flickering with green lines across panel.',
      preferredDate: '2025-04-15T09:00:00.000Z',
    });
    assert(false, 'Expected nonexistent provider to throw error');
  } catch (err: any) {
    assert(err.message.includes('does not exist'), 'Service rejects nonexistent provider ID');
  }

  // Test 4: Reject missing item
  const missingItem = validateCreateRepairRequest({
    itemId: '',
    customerId: 'usr_cust_001',
    providerId: 'prov_fixit_001',
    problemDescription: 'Screen flickering with green lines across panel.',
    preferredDate: '2025-04-15T09:00:00.000Z',
  });
  assert(!missingItem.isValid && missingItem.errors.some(e => e.includes('Item')), 'Rejects missing item ID');

  // Test 5: Reject short / missing description
  const shortDescription = validateCreateRepairRequest({
    itemId: 'item_laptop_001',
    customerId: 'usr_cust_001',
    providerId: 'prov_fixit_001',
    problemDescription: 'Broken',
    preferredDate: '2025-04-15T09:00:00.000Z',
  });
  assert(!shortDescription.isValid && shortDescription.errors.some(e => e.includes('at least 10 characters')), 'Rejects description shorter than 10 chars');

  // Test 6: Reject invalid date format
  const invalidDate = validateCreateRepairRequest({
    itemId: 'item_laptop_001',
    customerId: 'usr_cust_001',
    providerId: 'prov_fixit_001',
    problemDescription: 'Keyboard keys stick and sometimes double click when typing.',
    preferredDate: 'not-a-valid-date-string',
  });
  assert(!invalidDate.isValid && invalidDate.errors.some(e => e.includes('valid ISO date')), 'Rejects invalid date string');

  // Test 7: Retrieve request by ID
  try {
    const fetched = await repairRequestService.getRequestById('req_rep_101');
    assert(fetched !== null, 'Retrieves seeded repair request by ID');
    assert(fetched?.customerId === 'usr_cust_001', 'Retrieved request customer matches');
  } catch (err: any) {
    assert(false, `Get request by ID threw error: ${err.message}`);
  }

  console.log(`\n=== PHASE 2 TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
