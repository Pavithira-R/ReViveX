// ============================================================================
// Member 3 - Unified Search & Filtering Test Suite
// Verifies all 24 required search scenarios including parallel execution and HTTP integration
// ============================================================================

import http from 'http';
import app from '../src/app';
import { searchService } from '../src/services/searchService';
import { validateSearchQuery } from '../src/validators/searchValidator';
import { ItemAdapter, ProviderAdapter, ListingAdapter, RecyclingAdapter } from '../src/adapters';

export async function runSearchTests() {
  console.log('=== RUNNING MEMBER 3 TESTS: Unified Search & Filtering ===\n');
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
  // 1. Empty search (default all sources, page 1, limit 20)
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({});
    assert(val.isValid && Boolean(val.validatedQuery), 'Scenario 1: Empty search query validates successfully');
    const result = await searchService.search(val.validatedQuery!);
    assert(result.totalResults > 0, 'Scenario 1: Empty search returns results across all seeded domains');
    assert(result.summary.itemsCount > 0, 'Scenario 1: Contains items');
    assert(result.summary.providersCount > 0, 'Scenario 1: Contains providers');
    assert(result.summary.listingsCount > 0, 'Scenario 1: Contains listings');
    assert(result.summary.recyclingCount > 0, 'Scenario 1: Contains recycling');
  } catch (err: any) {
    assert(false, `Scenario 1 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 2. Keyword search
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ q: 'MacBook' });
    assert(val.isValid, 'Scenario 2: Keyword search validates');
    const result = await searchService.search(val.validatedQuery!);
    assert(result.totalResults > 0, 'Scenario 2: Finds results for "MacBook"');
    const hasMacInProviders = result.results.providers.some(p => p.description.includes('MacBook') || p.servicesOffered.some(s => s.includes('MacBook')));
    const hasMacInListings = result.results.listings.some(l => l.title.includes('MacBook'));
    assert(hasMacInProviders || hasMacInListings, 'Scenario 2: Matches "MacBook" in providers or listings');
  } catch (err: any) {
    assert(false, `Scenario 2 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 3. Category filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ category: 'Laptops' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.items.every(i => i.categoryName.toLowerCase().includes('laptop')), 'Scenario 3: Items match category "Laptops"');
    assert(result.results.listings.every(l => l.category.toLowerCase().includes('laptop')), 'Scenario 3: Listings match category "Laptops"');
  } catch (err: any) {
    assert(false, `Scenario 3 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 4. Action filter (REPAIR vs SELL)
  // --------------------------------------------------------------------------
  try {
    const valRepair = validateSearchQuery({ actionType: 'REPAIR' });
    const resRepair = await searchService.search(valRepair.validatedQuery!);
    assert(resRepair.results.providers.length > 0, 'Scenario 4: Action REPAIR includes providers');
    assert(resRepair.results.items.every(i => i.action === 'REPAIR'), 'Scenario 4: Action REPAIR only includes repairable items');
    assert(resRepair.results.listings.length === 0, 'Scenario 4: Action REPAIR excludes general marketplace listings');

    const valSell = validateSearchQuery({ actionType: 'SELL' });
    const resSell = await searchService.search(valSell.validatedQuery!);
    assert(resSell.results.providers.length === 0, 'Scenario 4: Action SELL excludes providers');
    assert(resSell.results.listings.every(l => l.actionType === 'SELL'), 'Scenario 4: Action SELL includes SELL listings');
  } catch (err: any) {
    assert(false, `Scenario 4 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 5. Condition filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ condition: 'DAMAGED' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.items.every(i => i.condition === 'DAMAGED'), 'Scenario 5: Items match condition DAMAGED');
  } catch (err: any) {
    assert(false, `Scenario 5 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 6. Entity type ITEMS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'ITEMS' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.items.length > 0, 'Scenario 6: entityType ITEMS returns items');
    assert(result.results.providers.length === 0, 'Scenario 6: Providers are empty');
    assert(result.results.listings.length === 0, 'Scenario 6: Listings are empty');
    assert(result.results.recycling.length === 0, 'Scenario 6: Recycling is empty');
    assert(result.sourceStatus?.providers === 'SKIPPED', 'Scenario 6: Unselected sources are SKIPPED');
  } catch (err: any) {
    assert(false, `Scenario 6 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 7. Entity type PROVIDERS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'PROVIDERS' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.providers.length > 0, 'Scenario 7: entityType PROVIDERS returns providers');
    assert(result.results.items.length === 0, 'Scenario 7: Items are empty');
  } catch (err: any) {
    assert(false, `Scenario 7 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 8. Entity type LISTINGS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'LISTINGS' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.listings.length > 0, 'Scenario 8: entityType LISTINGS returns listings');
    assert(result.results.providers.length === 0, 'Scenario 8: Providers are empty');
  } catch (err: any) {
    assert(false, `Scenario 8 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 9. Entity type RECYCLING
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'RECYCLING' });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.recycling.length > 0, 'Scenario 9: entityType RECYCLING returns recycling');
    assert(result.results.items.length === 0, 'Scenario 9: Items are empty');
  } catch (err: any) {
    assert(false, `Scenario 9 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 10. minRating
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ minRating: 4.8 });
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.providers.every(p => p.rating >= 4.8), 'Scenario 10: Providers all have rating >= 4.8');
  } catch (err: any) {
    assert(false, `Scenario 10 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 11. maxDistanceKm
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ maxDistanceKm: 3.0 });
    const result = await searchService.search(val.validatedQuery!);
    assert(
      result.results.providers.every(
        (p) => typeof p.distanceKm === 'number' && p.distanceKm <= 3.0
      ),
      'Scenario 11: Providers all have distanceKm <= 3.0'
    );
  } catch (err: any) {
    assert(false, `Scenario 11 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 12. minPrice
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ minPrice: 200 });
    const result = await searchService.search(val.validatedQuery!);
    assert(
      result.results.listings
        .filter((l) => l.actionType === 'SELL')
        .every((l) => typeof l.price === 'number' && l.price >= 200),
      'Scenario 12: Sell listings have price >= 200'
    );
  } catch (err: any) {
    assert(false, `Scenario 12 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 13. maxPrice
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ maxPrice: 400 });
    const result = await searchService.search(val.validatedQuery!);
    assert(
      result.results.listings
        .filter((l) => l.actionType === 'SELL')
        .every((l) => typeof l.price === 'number' && l.price <= 400),
      'Scenario 13: Sell listings have price <= 400'
    );
  } catch (err: any) {
    assert(false, `Scenario 13 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 14. Invalid actionType
  // --------------------------------------------------------------------------
  const valInvAction = validateSearchQuery({ actionType: 'NON_EXISTENT_ACTION' });
  assert(!valInvAction.isValid && valInvAction.errors.some(e => e.includes('actionType')), 'Scenario 14: Rejects invalid actionType');

  // --------------------------------------------------------------------------
  // 15. Invalid entityType
  // --------------------------------------------------------------------------
  const valInvEntity = validateSearchQuery({ entityType: 'INVALID_ENTITY' });
  assert(!valInvEntity.isValid && valInvEntity.errors.some(e => e.includes('entityType')), 'Scenario 15: Rejects invalid entityType');

  // --------------------------------------------------------------------------
  // 16. Invalid condition
  // --------------------------------------------------------------------------
  const valInvCond = validateSearchQuery({ condition: 'EXPLODED' });
  assert(!valInvCond.isValid && valInvCond.errors.some(e => e.includes('condition')), 'Scenario 16: Rejects invalid condition');

  // --------------------------------------------------------------------------
  // 17. Invalid page
  // --------------------------------------------------------------------------
  const valInvPage = validateSearchQuery({ page: 0 });
  assert(!valInvPage.isValid && valInvPage.errors.some(e => e.includes('page')), 'Scenario 17: Rejects page < 1');

  // --------------------------------------------------------------------------
  // 18. Invalid limit
  // --------------------------------------------------------------------------
  const valInvLimit = validateSearchQuery({ limit: 150 });
  assert(!valInvLimit.isValid && valInvLimit.errors.some(e => e.includes('limit')), 'Scenario 18: Rejects limit > 100');

  // --------------------------------------------------------------------------
  // 19. minPrice > maxPrice
  // --------------------------------------------------------------------------
  const valPriceBounds = validateSearchQuery({ minPrice: 500, maxPrice: 100 });
  assert(!valPriceBounds.isValid && valPriceBounds.errors.some(e => e.includes('maxPrice') && e.includes('minPrice')), 'Scenario 19: Rejects minPrice > maxPrice');

  // --------------------------------------------------------------------------
  // 20. Partial upstream failure resilience
  // --------------------------------------------------------------------------
  try {
    // Inject a failing query delegate on ItemAdapter
    ItemAdapter.setDelegates(
      async () => { throw new Error('Simulated upstream database timeout'); },
      null
    );

    const val = validateSearchQuery({});
    const res = await searchService.search(val.validatedQuery!);
    assert(res.sourceStatus?.items === 'UNAVAILABLE', 'Scenario 20: Flags failing source as UNAVAILABLE');
    assert(res.results.items.length === 0, 'Scenario 20: Failed source yields empty array without crashing');
    assert(res.results.providers.length > 0, 'Scenario 20: Healthy sources continue to return results');
    assert(res.sourceStatus?.providers === 'OK', 'Scenario 20: Healthy source status is OK');

    // Reset ItemAdapter delegates
    ItemAdapter.setDelegates(null, null);
  } catch (err: any) {
    assert(false, `Scenario 20 threw: ${err.message}`);
    ItemAdapter.setDelegates(null, null);
  }

  // --------------------------------------------------------------------------
  // 21. Parallel adapter execution
  // --------------------------------------------------------------------------
  try {
    let itemCalled = false;
    let providerCalled = false;
    ItemAdapter.setDelegates(async () => { itemCalled = true; return []; }, null);
    ProviderAdapter.setDelegates(async () => { providerCalled = true; return []; }, null);

    const val = validateSearchQuery({});
    await searchService.search(val.validatedQuery!);
    assert(itemCalled && providerCalled, 'Scenario 21: Parallel query triggers both active adapters');

    // Reset delegates
    ItemAdapter.setDelegates(null, null);
    ProviderAdapter.setDelegates(null, null);
  } catch (err: any) {
    assert(false, `Scenario 21 threw: ${err.message}`);
    ItemAdapter.setDelegates(null, null);
    ProviderAdapter.setDelegates(null, null);
  }

  // --------------------------------------------------------------------------
  // 22-24. Live Express HTTP Server Pipeline Integration & Envelope Tests
  // --------------------------------------------------------------------------
  console.log('\n--- Live HTTP Server Pipeline Integration Tests ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 22. HTTP GET /api/search with valid keyword
    const res = await fetch(`${baseUrl}/api/search?q=phone&category=Phones&limit=10`, {
      headers: { Connection: 'close' }
    });
    const json = (await res.json()) as any;
    assert(res.status === 200, 'Scenario 22: HTTP GET /api/search returns status 200');

    // 23. Correct response envelope
    assert(json.success === true, 'Scenario 23: Envelope success is true');
    assert(json.statusCode === 200, 'Scenario 23: Envelope statusCode is 200');
    assert(json.message === 'Search results retrieved successfully', 'Scenario 23: Correct response message');
    assert(json.data && typeof json.data === 'object', 'Scenario 23: Data object is present');
    assert(json.data.query === 'phone', 'Scenario 23: Echoes query in data');
    assert(json.data.appliedFilters.category === 'Phones', 'Scenario 23: Echoes applied filters');
    assert(json.data.results && Array.isArray(json.data.results.providers), 'Scenario 23: Results contains providers bucket');

    // 24. Correct result counts
    const sum =
      json.data.summary.itemsCount +
      json.data.summary.providersCount +
      json.data.summary.listingsCount +
      json.data.summary.recyclingCount;
    assert(json.data.totalResults === sum, 'Scenario 24: totalResults strictly equals sum of all bucket counts');

    // 25. HTTP GET /api/search with validation error (400)
    const errRes = await fetch(`${baseUrl}/api/search?actionType=INVALID_ACTION&minPrice=-5`, {
      headers: { Connection: 'close' }
    });
    const errJson = (await errRes.json()) as any;
    assert(errRes.status === 400, 'Scenario 25: HTTP GET with invalid params returns 400');
    assert(errJson.success === false, 'Scenario 25: Error envelope success is false');
    assert(Array.isArray(errJson.details) && errJson.details.length >= 2, 'Scenario 25: Details contains multiple validation error messages');
  } catch (httpErr: any) {
    assert(false, `HTTP tests threw error: ${httpErr.message}`);
  } finally {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(`\n=== UNIFIED SEARCH TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runSearchTests();
}
