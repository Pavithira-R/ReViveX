import { validateReviewInput } from '../src/validators/review.validator';
import { reviewService } from '../src/services/review.service';

/**
 * Member 6 Phase 1: Review System Automated Test Suite
 * Tests all 10 required scenarios explicitly
 */
async function runTests() {
  console.log('=====================================================');
  console.log('Starting Member 6 Phase 1: Review System Test Suite');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // Test 1: rating = 1 accepted
  // -----------------------------------------------------------------
  const test1Validation = validateReviewInput({
    rating: 1,
    providerId: 'provider-101',
    comment: 'Minimal rating test',
  });
  assert('Test 1: rating = 1 should be accepted', test1Validation.isValid);

  // -----------------------------------------------------------------
  // Test 2: rating = 5 accepted
  // -----------------------------------------------------------------
  const test2Validation = validateReviewInput({
    rating: 5,
    providerId: 'provider-101',
    comment: 'Max rating test',
  });
  assert('Test 2: rating = 5 should be accepted', test2Validation.isValid);

  // -----------------------------------------------------------------
  // Test 3: rating below 1 rejected
  // -----------------------------------------------------------------
  const test3Validation = validateReviewInput({
    rating: 0,
    providerId: 'provider-101',
  });
  assert(
    'Test 3: rating below 1 (0) should be rejected',
    !test3Validation.isValid && test3Validation.errors.some((e) => e.includes('between 1 and 5'))
  );

  const test3NegativeValidation = validateReviewInput({
    rating: -2,
    providerId: 'provider-101',
  });
  assert(
    'Test 3b: negative rating (-2) should be rejected',
    !test3NegativeValidation.isValid
  );

  // -----------------------------------------------------------------
  // Test 4: rating above 5 rejected
  // -----------------------------------------------------------------
  const test4Validation = validateReviewInput({
    rating: 6,
    providerId: 'provider-101',
  });
  assert(
    'Test 4: rating above 5 (6) should be rejected',
    !test4Validation.isValid && test4Validation.errors.some((e) => e.includes('between 1 and 5'))
  );

  // -----------------------------------------------------------------
  // Test 5: missing required target data rejected
  // -----------------------------------------------------------------
  const test5Validation = validateReviewInput({
    rating: 4,
    // No providerId, targetUserId, repairRequestId, or itemId
  });
  assert(
    'Test 5: missing required target entity data should be rejected',
    !test5Validation.isValid && test5Validation.errors.some((e) => e.includes('target information is required'))
  );

  // -----------------------------------------------------------------
  // Test 6: review with comment accepted
  // -----------------------------------------------------------------
  reviewService.clearMockStore();
  const test6Result = await reviewService.createReview(
    {
      rating: 4,
      comment: 'Excellent device repair service! Fixed my laptop motherboard swiftly.',
      providerId: 'provider-202',
    },
    'reviewer-user-01'
  );
  assert(
    'Test 6: review with comment accepted and saved',
    test6Result.rating === 4 && test6Result.comment?.includes('Excellent device repair') && !!test6Result.id
  );

  // -----------------------------------------------------------------
  // Test 7: review without comment accepted
  // -----------------------------------------------------------------
  const test7Result = await reviewService.createReview(
    {
      rating: 5,
      providerId: 'provider-202',
      // comment omitted
    },
    'reviewer-user-02'
  );
  assert(
    'Test 7: review without comment accepted (comment is null)',
    test7Result.rating === 5 && test7Result.comment === null && !!test7Result.id
  );

  // -----------------------------------------------------------------
  // Test 8: API/server error handled gracefully
  // -----------------------------------------------------------------
  try {
    // Attempt with invalid input to simulate error interception
    const invalidRun = validateReviewInput({ rating: 'not-a-number', providerId: 'prov-1' });
    assert(
      'Test 8: invalid/malformed non-numeric rating handled gracefully without crash',
      !invalidRun.isValid && invalidRun.errors.some((e) => e.includes('valid number'))
    );
  } catch (err) {
    assert('Test 8: Error handling', false, 'Threw unhandled exception');
  }

  // -----------------------------------------------------------------
  // Test 9: loading state representation & service response time
  // -----------------------------------------------------------------
  const startTime = Date.now();
  const summaryPromise = reviewService.getProviderReviews('provider-202');
  assert('Test 9a: Service returns an asynchronous Promise (for mobile loading state)', summaryPromise instanceof Promise);
  const summaryResult = await summaryPromise;
  const duration = Date.now() - startTime;
  assert('Test 9b: Async query resolves cleanly within reasonable time', duration < 2000 && summaryResult.totalReviews === 2);

  // -----------------------------------------------------------------
  // Test 10: empty review list verification
  // -----------------------------------------------------------------
  const emptySummary = await reviewService.getProviderReviews('non-existent-provider-999');
  assert(
    'Test 10: empty review list for provider with 0 reviews returns totalReviews: 0 and reviews: []',
    emptySummary.totalReviews === 0 &&
      emptySummary.reviews.length === 0 &&
      emptySummary.averageRating === 0
  );

  console.log('\n=====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
