// ============================================================================
// Member 3 - Recommendation Engine & API Test Suite
// ============================================================================

import http from 'http';
import app from '../src/app';
import { recommendationService } from '../src/services/recommendationService';
import { validateRecommendationInput } from '../src/validators/recommendationValidator';

async function runRecommendationTests() {
  console.log('=== RUNNING MEMBER 3 TESTS: Recommendation Engine & Validation ===\n');
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

  // --------------------------------------------------------------------------
  // Scenario 1: working + keep/use -> REUSE
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'LAPTOP',
      condition: 'WORKING_NORMALLY',
      age: '1-3 years',
      intention: 'keep/use',
      urgency: 'flexible',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 1 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'REUSE', 'Scenario 1: working + keep/use yields REUSE');
      assert(Array.isArray(result.rationale) && result.rationale.length > 0, 'Scenario 1 provides rationale');
      assert(result.alternativeAction === 'SELL', 'Scenario 1 alternative action is SELL');
    }
  } catch (err: any) {
    assert(false, `Scenario 1 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 2: working + sell -> SELL
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'Phone',
      condition: 'Working normally',
      age: 'Less than 1 year',
      intention: 'Sell',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 2 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'SELL', 'Scenario 2: working + sell yields SELL');
      assert(result.alternativeAction === 'DONATE', 'Scenario 2 alternative action is DONATE');
      assert(result.ruleTriggered === 'R-SEL-01', 'Scenario 2 triggers R-SEL-01 rule');
    }
  } catch (err: any) {
    assert(false, `Scenario 2 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 3: working + give away -> DONATE
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'TABLET',
      condition: 'WORKING_NORMALLY',
      age: '3-5 years',
      intention: 'GIVE_AWAY',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 3 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'DONATE', 'Scenario 3: working + give away yields DONATE');
      assert(result.alternativeAction === 'REUSE', 'Scenario 3 alternative action is REUSE');
      assert(result.ruleTriggered === 'R-DON-01', 'Scenario 3 triggers R-DON-01 rule');
    }
  } catch (err: any) {
    assert(false, `Scenario 3 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 4: not working + repair -> REPAIR
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'LAPTOP',
      condition: 'NOT_WORKING',
      age: '1-3 years',
      intention: 'REPAIR',
      urgency: 'URGENT',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 4 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'REPAIR', 'Scenario 4: not working (<5 yrs) + repair yields REPAIR');
      assert(result.alternativeAction === 'SELL', 'Scenario 4 alternative action is SELL (for parts)');
      assert(result.ruleTriggered === 'R-REP-01', 'Scenario 4 triggers R-REP-01 rule');
    }
  } catch (err: any) {
    assert(false, `Scenario 4 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 5: damaged/old + responsible disposal -> RECYCLE
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'DESKTOP',
      condition: 'PHYSICALLY_DAMAGED',
      age: '> 5 years',
      intention: 'DISPOSE_RESPONSIBLY',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 5 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'RECYCLE', 'Scenario 5: damaged + >5 yrs yields RECYCLE');
      assert(result.ruleTriggered === 'R-REC-01', 'Scenario 5 triggers R-REC-01 safety override');
      assert(result.alternativeAction === null, 'Scenario 5 has no alternative (e-waste safety)');
    }
  } catch (err: any) {
    assert(false, `Scenario 5 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 6: working with problems + explicit disposal -> RECYCLE
  // --------------------------------------------------------------------------
  try {
    const input = {
      category: 'PRINTER',
      condition: 'WORKING_WITH_PROBLEMS',
      age: '3-5 years',
      intention: 'DISPOSE_RESPONSIBLY',
    };
    const validation = validateRecommendationInput(input);
    assert(validation.isValid && Boolean(validation.normalized), 'Scenario 6 validation succeeds');

    if (validation.normalized) {
      const result = recommendationService.evaluate(validation.normalized);
      assert(result.recommendation === 'RECYCLE', 'Scenario 6: explicit disposal yields RECYCLE');
      assert(result.ruleTriggered === 'R-REC-02', 'Scenario 6 triggers R-REC-02 rule');
    }
  } catch (err: any) {
    assert(false, `Scenario 6 threw error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 7: invalid input values rejected
  // --------------------------------------------------------------------------
  const invalidInput = {
    category: 'TOASTER',
    condition: 'BURNT',
    age: 'CENTURIES',
    intention: 'MAGIC',
    urgency: 'YESTERDAY',
  };
  const invalidValidation = validateRecommendationInput(invalidInput);
  assert(!invalidValidation.isValid, 'Scenario 7: invalid input values are rejected');
  assert(invalidValidation.errors.length >= 4, 'Scenario 7: reports all invalid field errors');
  assert(
    invalidValidation.errors.some(e => e.includes('TOASTER')),
    'Scenario 7: specifies invalid category error'
  );

  // --------------------------------------------------------------------------
  // Scenario 8: missing required fields rejected
  // --------------------------------------------------------------------------
  const missingInput = {
    category: 'PHONE',
  };
  const missingValidation = validateRecommendationInput(missingInput as any);
  assert(!missingValidation.isValid, 'Scenario 8: missing fields are rejected');
  assert(
    missingValidation.errors.some(e => e.includes("'condition' is required")),
    'Scenario 8: flags missing condition'
  );
  assert(
    missingValidation.errors.some(e => e.includes("'age' is required")),
    'Scenario 8: flags missing age'
  );
  assert(
    missingValidation.errors.some(e => e.includes("'intention' is required")),
    'Scenario 8: flags missing intention'
  );

  // --------------------------------------------------------------------------
  // Scenario 9: empty / null body rejected
  // --------------------------------------------------------------------------
  const emptyValidation = validateRecommendationInput(null as any);
  assert(!emptyValidation.isValid, 'Scenario 9: null input body rejected');

  // --------------------------------------------------------------------------
  // Scenario 10: Live Express HTTP Server Pipeline Integration Test
  // --------------------------------------------------------------------------
  console.log('\n=== RUNNING EXPRESS HTTP SERVER PIPELINE TESTS ===\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 10.1 GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = (await healthRes.json()) as any;
    assert(healthRes.status === 200, 'HTTP: GET /health returns 200');
    assert(healthJson.status === 'ok', 'HTTP: health status is ok');

    // 10.2 POST /api/recommendations/evaluate - Valid
    const evalRes = await fetch(`${baseUrl}/api/recommendations/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'LAPTOP',
        condition: 'WORKING_WITH_PROBLEMS',
        age: '1-3 years',
        intention: 'REPAIR',
        urgency: 'URGENT',
      }),
    });
    const evalJson = (await evalRes.json()) as any;
    assert(evalRes.status === 200, 'HTTP: POST /api/recommendations/evaluate returns 200');
    assert(evalJson.success === true, 'HTTP: success is true');
    assert(evalJson.data.recommendation === 'REPAIR', 'HTTP: recommendation is REPAIR');
    assert(evalJson.data.alternativeAction === 'SELL', 'HTTP: alternativeAction is SELL');
    assert(evalJson.data.rationale.length > 0, 'HTTP: rationale contains points');

    // 10.3 POST /api/recommendations/evaluate - Invalid Body (400)
    const badRes = await fetch(`${baseUrl}/api/recommendations/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'LAPTOP' }),
    });
    const badJson = (await badRes.json()) as any;
    assert(badRes.status === 400, 'HTTP: POST with missing fields returns 400');
    assert(badJson.success === false, 'HTTP: bad request success is false');
    assert(Array.isArray(badJson.details) && badJson.details.length > 0, 'HTTP: details contains validation error list');

    // 10.4 404 Endpoint Not Found
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-route`);
    assert(notFoundRes.status === 404, 'HTTP: unknown route returns 404');
  } catch (httpErr: any) {
    assert(false, `HTTP tests threw error: ${httpErr.message}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(`\n=== FINAL TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRecommendationTests();
