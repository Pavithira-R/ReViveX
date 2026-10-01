// ============================================================================
// Member 3 - Master Test Suite Runner
// Runs all Recommendation and Integration Adapter test suites sequentially
// ============================================================================

import { runRecommendationTests } from './recommendation.test';
import { runAdapterTests } from './adapters.test';
import { runSearchTests } from './search.test';
import { runDiscoveryTests } from './discovery.test';

async function main() {
  console.log('************************************************************');
  console.log('      ReViveX Member 3 - Master Test Suite Execution        ');
  console.log('************************************************************\n');

  try {
    await runRecommendationTests();
    await runAdapterTests();
    await runSearchTests();
    await runDiscoveryTests();
    console.log('************************************************************');
    console.log('    ALL MEMBER 3 TEST SUITES PASSED SUCCESSFULLY (100%)    ');
    console.log('************************************************************\n');
  } catch (err: any) {
    console.error('Test execution failed with unhandled error:', err);
    process.exit(1);
  }
}

main();
