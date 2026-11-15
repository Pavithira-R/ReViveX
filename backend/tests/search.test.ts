// ============================================================================
// Member 3 - Unified Search & Filtering Test Suite
// Verifies search scenarios, filtering before pagination, multi-page pagination,
// Haversine distance calculations, coordinate validation, and HTTP integration.
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

  // Inject mock test items into ItemAdapter for search test suite
  const mockTestItems = [
    {
      id: 'item_test_001',
      name: 'Lenovo ThinkPad T480',
      brand: 'Lenovo',
      condition: 'WORKING',
      action: 'SELL',
      description: '14-inch laptop',
      location: { city: 'Downtown Tech District', latitude: 40.7128, longitude: -74.006 },
      status: 'POSTED',
      images: ['https://example.com/item1.jpg'],
      ownerId: 'usr_001',
      categoryId: 'cat_laptops_01',
      category: { id: 'cat_laptops_01', name: 'Laptops' },
      owner: { id: 'usr_001', name: 'Jane Doe' },
    },
    {
      id: 'item_test_002',
      name: 'Apple iPhone 12 Pro',
      brand: 'Apple',
      condition: 'DAMAGED',
      action: 'REPAIR',
      description: 'Cracked screen',
      location: { city: 'Midtown East', latitude: 40.7549, longitude: -73.984 },
      status: 'POSTED',
      images: ['https://example.com/item2.jpg'],
      ownerId: 'usr_002',
      categoryId: 'cat_phones_02',
      category: { id: 'cat_phones_02', name: 'Mobile Phones' },
      owner: { id: 'usr_002', name: 'Mark Vance' },
    },
    {
      id: 'item_test_003',
      name: 'Dell XPS 15 Laptop',
      brand: 'Dell',
      condition: 'WORKING',
      action: 'SELL',
      description: 'Core i7 laptop',
      location: { city: 'Westside Eco District', latitude: 40.7306, longitude: -73.9352 },
      status: 'POSTED',
      images: ['https://example.com/item3.jpg'],
      ownerId: 'usr_003',
      categoryId: 'cat_laptops_01',
      category: { id: 'cat_laptops_01', name: 'Laptops' },
      owner: { id: 'usr_003', name: 'Samantha Green' },
    },
  ];

  ItemAdapter.setDelegates(
    async () => mockTestItems,
    async (id) => mockTestItems.find((i) => i.id === id) || null
  );

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
    assert(val.isValid, 'Scenario 3: Category search validates');
    const result = await searchService.search(val.validatedQuery!);
    assert(result.results.items.every(i => i.categoryName.toLowerCase().includes('laptop') || i.name.toLowerCase().includes('laptop')), 'Scenario 3: Items match category "Laptops"');
    assert(result.results.listings.every(l => l.category.toLowerCase().includes('laptop')), 'Scenario 3: Listings match category "Laptops"');
  } catch (err: any) {
    assert(false, `Scenario 3 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 4. Action Type filter
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
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.items.every(i => i.condition === 'DAMAGED'), 'Scenario 5: Items match condition DAMAGED');
  } catch (err: any) {
    assert(false, `Scenario 5 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 6. Entity Type = ITEMS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'ITEMS' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.items.length > 0, 'Scenario 6: entityType ITEMS returns items');
    assert(res.results.providers.length === 0, 'Scenario 6: Providers are empty');
    assert(res.results.listings.length === 0, 'Scenario 6: Listings are empty');
    assert(res.results.recycling.length === 0, 'Scenario 6: Recycling is empty');
    assert(res.sourceStatus?.providers === 'SKIPPED', 'Scenario 6: Unselected sources are SKIPPED');
  } catch (err: any) {
    assert(false, `Scenario 6 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 7. Entity Type = PROVIDERS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'PROVIDERS' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.providers.length > 0, 'Scenario 7: entityType PROVIDERS returns providers');
    assert(res.results.items.length === 0, 'Scenario 7: Items are empty');
  } catch (err: any) {
    assert(false, `Scenario 7 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 8. Entity Type = LISTINGS
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'LISTINGS' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.listings.length > 0, 'Scenario 8: entityType LISTINGS returns listings');
    assert(res.results.providers.length === 0, 'Scenario 8: Providers are empty');
  } catch (err: any) {
    assert(false, `Scenario 8 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 9. Entity Type = RECYCLING
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ entityType: 'RECYCLING' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.recycling.length > 0, 'Scenario 9: entityType RECYCLING returns recycling');
    assert(res.results.items.length === 0, 'Scenario 9: Items are empty');
  } catch (err: any) {
    assert(false, `Scenario 9 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 10. Provider minRating filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ minRating: 4.8 });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.providers.every(p => p.rating >= 4.8), 'Scenario 10: Providers all have rating >= 4.8');
  } catch (err: any) {
    assert(false, `Scenario 10 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 11. Provider maxDistanceKm filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ maxDistanceKm: 3.0 });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.providers.every(p => (p.distanceKm || 0) <= 3.0), 'Scenario 11: Providers all have distanceKm <= 3.0');
  } catch (err: any) {
    assert(false, `Scenario 11 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 12. Listing minPrice filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ minPrice: 200, actionType: 'SELL' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.listings.every(l => l.price !== null && l.price !== undefined && l.price >= 200), 'Scenario 12: Sell listings have price >= 200');
  } catch (err: any) {
    assert(false, `Scenario 12 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 13. Listing maxPrice filter
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ maxPrice: 400, actionType: 'SELL' });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.listings.every(l => l.price !== null && l.price !== undefined && l.price <= 400), 'Scenario 13: Sell listings have price <= 400');
  } catch (err: any) {
    assert(false, `Scenario 13 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 14. Invalid actionType validation
  // --------------------------------------------------------------------------
  const valInvAction = validateSearchQuery({ actionType: 'DESTROY' });
  assert(!valInvAction.isValid && valInvAction.errors.some(e => e.includes('actionType')), 'Scenario 14: Rejects invalid actionType');

  // --------------------------------------------------------------------------
  // 15. Invalid entityType validation
  // --------------------------------------------------------------------------
  const valInvEntity = validateSearchQuery({ entityType: 'COMPANIES' });
  assert(!valInvEntity.isValid && valInvEntity.errors.some(e => e.includes('entityType')), 'Scenario 15: Rejects invalid entityType');

  // --------------------------------------------------------------------------
  // 16. Invalid condition validation
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

    ItemAdapter.setDelegates(
      async () => mockTestItems,
      async (id) => mockTestItems.find((i) => i.id === id) || null
    );
    ProviderAdapter.setDelegates(null, null);
  } catch (err: any) {
    assert(false, `Scenario 21 threw: ${err.message}`);
    ItemAdapter.setDelegates(
      async () => mockTestItems,
      async (id) => mockTestItems.find((i) => i.id === id) || null
    );
    ProviderAdapter.setDelegates(null, null);
  }

  // --------------------------------------------------------------------------
  // 22. Multi-Page Pagination: Page 1 vs Page 2 (No Duplicate Results)
  // --------------------------------------------------------------------------
  try {
    const valPage1 = validateSearchQuery({ entityType: 'PROVIDERS', page: 1, limit: 1 });
    const valPage2 = validateSearchQuery({ entityType: 'PROVIDERS', page: 2, limit: 1 });
    const resPage1 = await searchService.search(valPage1.validatedQuery!);
    const resPage2 = await searchService.search(valPage2.validatedQuery!);

    assert(resPage1.results.providers.length === 1, 'Scenario 22: Page 1 returns 1 provider');
    assert(resPage2.results.providers.length === 1, 'Scenario 22: Page 2 returns 1 provider');
    assert(
      resPage1.results.providers[0].id !== resPage2.results.providers[0].id,
      'Scenario 22: Page 1 and Page 2 return distinct non-overlapping providers (no duplicates)'
    );
  } catch (err: any) {
    assert(false, `Scenario 22 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 23. Filtering Before Pagination (Category Filter on Items)
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ category: 'Laptops', limit: 10 });
    const res = await searchService.search(val.validatedQuery!);
    assert(
      res.results.items.length > 0 && res.results.items.every(i => i.categoryName.toLowerCase().includes('laptop') || i.name.toLowerCase().includes('laptop')),
      'Scenario 23: Category filtering occurs before pagination on items'
    );
  } catch (err: any) {
    assert(false, `Scenario 23 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 24. Filtering Before Pagination (Condition Filter on Listings)
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({ condition: 'WORKING_NORMALLY', limit: 10 });
    assert(val.isValid && Boolean(val.validatedQuery), 'Scenario 24: Condition WORKING_NORMALLY validates');
    if (val.validatedQuery) {
      const res = await searchService.search(val.validatedQuery);
      assert(
        res.results.listings.length > 0 &&
          res.results.listings.every(
            (l) =>
              l.condition.toLowerCase().includes('like new') ||
              l.condition.toLowerCase().includes('good') ||
              l.condition.toLowerCase().includes('working')
          ),
        'Scenario 24: Condition filtering occurs before pagination on listings'
      );
    }
  } catch (err: any) {
    assert(false, `Scenario 24 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 25. GPS Coordinate Validation in Search
  // --------------------------------------------------------------------------
  try {
    // 25.1 Valid coordinates & radius
    const valValidCoords = validateSearchQuery({
      latitude: 40.7128,
      longitude: -74.006,
      radiusKm: 15,
    });
    assert(valValidCoords.isValid, 'Scenario 25.1: Valid latitude & longitude pass validation');
    assert(valValidCoords.validatedQuery?.latitude === 40.7128, 'Scenario 25.1: Parses latitude');
    assert(valValidCoords.validatedQuery?.longitude === -74.006, 'Scenario 25.1: Parses longitude');
    assert(valValidCoords.validatedQuery?.radiusKm === 15, 'Scenario 25.1: Parses radiusKm');

    // 25.2 Lone latitude without longitude rejected
    const valLoneLat = validateSearchQuery({ latitude: 40.7128 });
    assert(!valLoneLat.isValid, 'Scenario 25.2: Lone latitude without longitude rejected');
    assert(valLoneLat.errors.some(e => e.includes('Both')), 'Scenario 25.2: Reports missing longitude');

    // 25.3 Latitude out of bounds rejected
    const valBadLat = validateSearchQuery({ latitude: 95.0, longitude: 20.0 });
    assert(!valBadLat.isValid, 'Scenario 25.3: Latitude > 90 rejected');

    // 25.4 Longitude out of bounds rejected
    const valBadLon = validateSearchQuery({ latitude: 45.0, longitude: -195.0 });
    assert(!valBadLon.isValid, 'Scenario 25.4: Longitude < -180 rejected');
  } catch (err: any) {
    assert(false, `Scenario 25 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 26. GPS Distance Calculation, Radius Filtering & Sorting
  // --------------------------------------------------------------------------
  try {
    const val = validateSearchQuery({
      latitude: 40.7128,
      longitude: -74.006,
      radiusKm: 50,
      entityType: 'PROVIDERS',
    });
    const res = await searchService.search(val.validatedQuery!);
    assert(res.results.providers.length >= 2, 'Scenario 26: Returns providers matching spatial query');
    assert(
      res.results.providers[0].distanceKm !== null && res.results.providers[0].distanceKm !== undefined,
      'Scenario 26: Provider distanceKm is dynamically populated'
    );
    // Nearest first sorting
    const dist1 = res.results.providers[0].distanceKm!;
    const dist2 = res.results.providers[1].distanceKm!;
    assert(dist1 <= dist2, 'Scenario 26: Providers are sorted by distance ascending (nearest first)');
  } catch (err: any) {
    assert(false, `Scenario 26 threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // 27-29. Live Express HTTP Server Pipeline Integration & Envelope Tests
  // --------------------------------------------------------------------------
  console.log('\n--- Live HTTP Server Pipeline Integration Tests ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 27. HTTP GET /api/search with valid keyword
    const res = await fetch(`${baseUrl}/api/search?q=phone&category=Phones&limit=10`, {
      headers: { Connection: 'close' }
    });
    const json = (await res.json()) as any;
    assert(res.status === 200, 'Scenario 27: HTTP GET /api/search returns status 200');
    assert(json.success === true, 'Scenario 27: Envelope success is true');
    assert(json.statusCode === 200, 'Scenario 27: Envelope statusCode is 200');
    assert(json.message === 'Search results retrieved successfully', 'Scenario 27: Correct response message');
    assert(json.data && typeof json.data === 'object', 'Scenario 27: Data object is present');
    assert(json.data.query === 'phone', 'Scenario 27: Echoes query in data');
    assert(json.data.appliedFilters.category === 'Phones', 'Scenario 27: Echoes applied filters');
    assert(json.data.results && Array.isArray(json.data.results.providers), 'Scenario 27: Results contains providers bucket');

    // 28. HTTP GET /api/search with coordinates and radius
    const geoRes = await fetch(`${baseUrl}/api/search?latitude=40.7128&longitude=-74.006&radiusKm=20&limit=5`, {
      headers: { Connection: 'close' }
    });
    const geoJson = (await geoRes.json()) as any;
    assert(geoRes.status === 200, 'Scenario 28: HTTP GET with coordinates returns 200');
    assert(geoJson.data.appliedFilters.latitude === 40.7128, 'Scenario 28: Preserves latitude in appliedFilters');
    assert(geoJson.data.appliedFilters.radiusKm === 20, 'Scenario 28: Preserves radiusKm in appliedFilters');

    // 29. HTTP GET /api/search with validation error (400)
    const errRes = await fetch(`${baseUrl}/api/search?actionType=INVALID_ACTION&minPrice=-5`, {
      headers: { Connection: 'close' }
    });
    const errJson = (await errRes.json()) as any;
    assert(errRes.status === 400, 'Scenario 29: HTTP GET with invalid params returns 400');
    assert(errJson.success === false, 'Scenario 29: Error envelope success is false');
    assert(Array.isArray(errJson.details) && errJson.details.length >= 2, 'Scenario 29: Details contains multiple validation error messages');
  } catch (httpErr: any) {
    assert(false, `HTTP tests threw error: ${httpErr.message}`);
  } finally {
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
