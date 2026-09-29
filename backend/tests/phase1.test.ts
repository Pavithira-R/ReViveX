// ============================================================================
// Member 4 - Phase 1 Test Suite (Provider Profile)
// ============================================================================

import { providerService } from '../src/services/providerService';
import { validateProviderId, validateProviderQuery } from '../src/validators/providerValidator';

async function runPhase1Tests() {
  console.log('=== RUNNING PHASE 1 TESTS: Service Provider Profile ===\n');
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

  // Test 1: Fetch all providers
  try {
    const providers = await providerService.getAllProviders();
    assert(Array.isArray(providers) && providers.length >= 3, 'Fetch all providers returns at least 3 seeded providers');
    assert(providers[0].businessName.length > 0, 'First provider has a valid business name');
    assert(typeof providers[0].rating === 'number' && providers[0].rating > 0, 'Provider has a positive numeric rating');
    assert(Array.isArray(providers[0].servicesOffered) && providers[0].servicesOffered.length > 0, 'Provider has services offered list');
  } catch (err: any) {
    assert(false, `Fetch all providers threw an error: ${err.message}`);
  }

  // Test 2: Search provider by keyword
  try {
    const searchResults = await providerService.getAllProviders({ search: 'MacBook' });
    assert(searchResults.length > 0, 'Search by "MacBook" returns matching provider');
    assert(searchResults.every(p => 
      p.description.toLowerCase().includes('macbook') || 
      p.servicesOffered.some(s => s.toLowerCase().includes('macbook')) ||
      p.businessName.toLowerCase().includes('macbook')
    ), 'Search results correctly match query keyword');
  } catch (err: any) {
    assert(false, `Search provider threw an error: ${err.message}`);
  }

  // Test 3: Fetch provider by valid ID
  try {
    const provider = await providerService.getProviderById('prov_fixit_001');
    assert(provider !== null, 'Fetch provider by valid ID "prov_fixit_001" succeeds');
    assert(provider?.isVerified === true, 'Provider verification status is preserved');
    assert(provider?.businessName === 'FixIt Pro Electronics', 'Provider business name matches expected value');
    assert(Boolean(provider?.availability), 'Provider availability schedule is present');
  } catch (err: any) {
    assert(false, `Fetch provider by ID threw an error: ${err.message}`);
  }

  // Test 4: Fetch nonexistent provider ID
  try {
    const missingProvider = await providerService.getProviderById('prov_non_existent_999');
    assert(missingProvider === null, 'Fetch nonexistent provider returns null');
  } catch (err: any) {
    assert(false, `Fetch nonexistent provider threw unexpected error: ${err.message}`);
  }

  // Test 5: Validation rules
  const validId = validateProviderId('prov_fixit_001');
  assert(validId.isValid && validId.errors.length === 0, 'Valid ID passes validation');

  const emptyId = validateProviderId('');
  assert(!emptyId.isValid && emptyId.errors.length > 0, 'Empty ID fails validation');

  const validQuery = validateProviderQuery({ search: 'Screen' });
  assert(validQuery.isValid, 'Valid query passes validation');

  const longQuery = validateProviderQuery({ search: 'a'.repeat(150) });
  assert(!longQuery.isValid && longQuery.errors.length > 0, 'Excessively long query is rejected');

  console.log(`\n=== PHASE 1 TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Tests();
