// ============================================================================
// Member 3 - Integration Adapters Test Suite
// Verifies normalization, filtering, delegation, Haversine distance, and error handling
// ============================================================================

import {
  ItemAdapter,
  normalizeItem,
  mapToMember2Condition,
  ProviderAdapter,
  normalizeProvider,
  ListingAdapter,
  normalizeListing,
  RecyclingAdapter,
  normalizeRecyclingRequest,
} from '../src/adapters';
import { calculateHaversineDistanceKm } from '../src/utils/distance';

export async function runAdapterTests() {
  console.log('=== RUNNING MEMBER 3 TESTS: Integration Adapters ===\n');
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

  // ==========================================================================
  // 0. HAVERSINE DISTANCE UTILITY TESTS
  // ==========================================================================
  console.log('--- 0. Haversine Distance Utility Tests ---');
  {
    // Same coordinate distance is 0 km
    const distZero = calculateHaversineDistanceKm(40.7128, -74.006, 40.7128, -74.006);
    assert(distZero === 0, 'Haversine: identical coordinates yield 0 km');

    // Known approximate distance: New York (40.7128, -74.0060) to Philadelphia (39.9526, -75.1652) ~ 129-130 km
    const distNyPhilly = calculateHaversineDistanceKm(40.7128, -74.006, 39.9526, -75.1652);
    assert(
      distNyPhilly !== null && distNyPhilly >= 128 && distNyPhilly <= 132,
      `Haversine: computes NY to Philly distance accurately (${distNyPhilly} km)`
    );

    // Invalid / null coordinates return null
    assert(calculateHaversineDistanceKm(null, -74.0, 40.0, -73.0) === null, 'Haversine: returns null for null coordinate');
    assert(calculateHaversineDistanceKm(NaN, -74.0, 40.0, -73.0) === null, 'Haversine: returns null for NaN');
    assert(calculateHaversineDistanceKm(120, 50, 40, 50) === null, 'Haversine: returns null for latitude > 90');
    assert(calculateHaversineDistanceKm(40, -200, 40, 50) === null, 'Haversine: returns null for longitude < -180');
  }

  // ==========================================================================
  // 1. ITEM ADAPTER (MEMBER 2)
  // ==========================================================================
  console.log('\n--- 1. ItemAdapter (Member 2) Tests ---');

  // 1.1 normalizeItem - complete payload
  try {
    const raw = {
      id: 'item_test_101',
      name: 'MacBook Pro 16',
      brand: 'Apple',
      condition: 'WORKING',
      action: 'SELL',
      description: 'Used for graphic design. Excellent battery.',
      location: { city: 'Colombo', latitude: 6.9271, longitude: 79.8612 },
      images: ['https://example.com/img1.jpg'],
      owner: { id: 'usr_01', name: 'Alice' },
      ownerId: 'usr_01',
      categoryId: 'cat_01',
      category: { id: 'cat_01', name: 'Laptops' },
      status: 'POSTED',
      createdAt: '2026-09-01T12:00:00.000Z',
    };
    const norm = normalizeItem(raw);
    assert(norm.id === 'item_test_101', 'ItemAdapter: preserves id');
    assert(norm.name === 'MacBook Pro 16', 'ItemAdapter: preserves name');
    assert(norm.brand === 'Apple', 'ItemAdapter: preserves brand');
    assert(norm.condition === 'WORKING', 'ItemAdapter: preserves condition WORKING');
    assert(norm.action === 'SELL', 'ItemAdapter: preserves action SELL');
    assert(norm.categoryName === 'Laptops', 'ItemAdapter: extracts category name from relation');
    assert(norm.ownerName === 'Alice', 'ItemAdapter: extracts owner name');
    assert(norm.source === 'MEMBER_2_ITEMS', 'ItemAdapter: labels source correctly');
  } catch (err: any) {
    assert(false, `ItemAdapter normalizeItem threw: ${err.message}`);
  }

  // 1.2 normalizeItem - fallback & error handling
  try {
    const rawSparse = { id: 999 };
    const normSparse = normalizeItem(rawSparse);
    assert(normSparse.id === '999', 'ItemAdapter: converts numeric id to string');
    assert(normSparse.name === 'Untitled Electronic Device', 'ItemAdapter: uses fallback name');
    assert(normSparse.condition === 'WORKING', 'ItemAdapter: defaults unknown condition to WORKING');
    assert(normSparse.action === 'REUSE', 'ItemAdapter: defaults unknown action to REUSE');

    let threw = false;
    try {
      normalizeItem(null);
    } catch {
      threw = true;
    }
    assert(threw, 'ItemAdapter: throws on null input');
  } catch (err: any) {
    assert(false, `ItemAdapter sparse test threw: ${err.message}`);
  }

  // 1.3 mapToMember2Condition
  assert(mapToMember2Condition('WORKING_NORMALLY') === 'WORKING', 'mapToMember2Condition: WORKING_NORMALLY -> WORKING');
  assert(mapToMember2Condition('working_with_problems') === 'DAMAGED', 'mapToMember2Condition: working_with_problems -> DAMAGED');
  assert(mapToMember2Condition('PHYSICALLY_DAMAGED') === 'BROKEN', 'mapToMember2Condition: PHYSICALLY_DAMAGED -> BROKEN');
  assert(mapToMember2Condition('not_working') === 'BROKEN', 'mapToMember2Condition: not_working -> BROKEN');
  assert(mapToMember2Condition('WORKING') === 'WORKING', 'mapToMember2Condition: passthrough WORKING');
  assert(mapToMember2Condition(undefined) === undefined, 'mapToMember2Condition: undefined on missing');

  // 1.4 queryItems & getItemById
  try {
    const mockItems = [
      {
        id: 'item_lenovo_001',
        name: 'Lenovo ThinkPad T480',
        brand: 'Lenovo',
        condition: 'WORKING',
        action: 'SELL',
        description: '14-inch laptop',
        location: { city: 'Downtown Tech District', latitude: 40.7128, longitude: -74.006 },
        status: 'POSTED',
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
        ownerId: 'usr_cust_001',
        categoryId: 'cat_laptops_01',
        category: { id: 'cat_laptops_01', name: 'Laptops' },
        owner: { id: 'usr_cust_001', name: 'Jane Doe' },
      },
      {
        id: 'item_iphone_002',
        name: 'Apple iPhone 12 Pro',
        brand: 'Apple',
        condition: 'DAMAGED',
        action: 'REPAIR',
        description: 'Cracked screen',
        location: { city: 'Midtown East', latitude: 40.7549, longitude: -73.984 },
        status: 'POSTED',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
        ownerId: 'usr_cust_002',
        categoryId: 'cat_phones_02',
        category: { id: 'cat_phones_02', name: 'Mobile Phones' },
        owner: { id: 'usr_cust_002', name: 'Mark Vance' },
      },
      {
        id: 'item_dell_003',
        name: 'Dell UltraSharp 24 Monitor',
        brand: 'Dell',
        condition: 'WORKING',
        action: 'DONATE',
        description: 'Monitor',
        location: { city: 'Westside Eco District', latitude: 40.7306, longitude: -73.9352 },
        status: 'POSTED',
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'],
        ownerId: 'usr_cust_003',
        categoryId: 'cat_monitors_03',
        category: { id: 'cat_monitors_03', name: 'Monitors' },
        owner: { id: 'usr_cust_003', name: 'Samantha Green' },
      },
    ];

    ItemAdapter.setDelegates(
      async () => mockItems,
      async (id) => mockItems.find((i) => i.id === id) || null
    );

    const allItems = await ItemAdapter.queryItems();
    assert(Array.isArray(allItems) && allItems.length >= 3, 'ItemAdapter.queryItems returns items array');

    const searchResults = await ItemAdapter.queryItems({ search: 'ThinkPad' });
    assert(searchResults.length === 1 && searchResults[0].brand === 'Lenovo', 'ItemAdapter.queryItems filters by search');

    const donateResults = await ItemAdapter.queryItems({ action: 'DONATE' });
    assert(donateResults.length >= 1 && donateResults[0].action === 'DONATE', 'ItemAdapter.queryItems filters by action');

    const categoryResults = await ItemAdapter.queryItems({ category: 'Laptops' });
    assert(categoryResults.length >= 1 && categoryResults[0].categoryName === 'Laptops', 'ItemAdapter.queryItems filters by category before pagination');

    const paged = await ItemAdapter.queryItems({ page: 1, limit: 1 });
    assert(paged.length === 1, 'ItemAdapter.queryItems respects pagination limit');

    // Dynamic distance calculation with GPS coords
    const nearItems = await ItemAdapter.queryItems({
      latitude: 40.7128,
      longitude: -74.006,
      radiusKm: 10,
    });
    assert(nearItems.length >= 1, 'ItemAdapter: calculates distance and filters within radius');
    assert(nearItems[0].distanceKm !== null && nearItems[0].distanceKm !== undefined, 'ItemAdapter: attaches distanceKm');

    const single = await ItemAdapter.getItemById('item_lenovo_001');
    assert(single !== null && single.name.includes('ThinkPad'), 'ItemAdapter.getItemById finds item');

    const missing = await ItemAdapter.getItemById('non_existent_item');
    assert(missing === null, 'ItemAdapter.getItemById returns null on missing');
  } catch (err: any) {
    assert(false, `ItemAdapter queryItems threw: ${err.message}`);
  }

  // 1.5 ItemAdapter delegate hook
  try {
    ItemAdapter.setDelegates(
      async () => [{ id: 'mock_del_01', name: 'Delegated Device', condition: 'WORKING', action: 'REUSE' }],
      async (id) => ({ id, name: 'Single Delegated', condition: 'WORKING', action: 'REUSE' })
    );
    const delegated = await ItemAdapter.queryItems();
    assert(delegated.length === 1 && delegated[0].name === 'Delegated Device', 'ItemAdapter: uses injected query delegate');
    const singleDel = await ItemAdapter.getItemById('any_id');
    assert(singleDel?.name === 'Single Delegated', 'ItemAdapter: uses injected get delegate');
    // Reset delegates
    ItemAdapter.setDelegates(null, null);
  } catch (err: any) {
    assert(false, `ItemAdapter delegate test threw: ${err.message}`);
  }

  // ==========================================================================
  // 2. PROVIDER ADAPTER (MEMBER 4)
  // ==========================================================================
  console.log('\n--- 2. ProviderAdapter (Member 4) Tests ---');

  // 2.1 normalizeProvider
  try {
    const raw = {
      id: 'prov_test_1',
      name: 'Bob Fixer',
      businessName: 'Bob Repairs',
      rating: 4.86,
      distanceKm: 3.2,
      isVerified: true,
      services: ['Laptop', 'Phone'],
    };
    const norm = normalizeProvider(raw);
    assert(norm.id === 'prov_test_1', 'ProviderAdapter: preserves id');
    assert(norm.businessName === 'Bob Repairs', 'ProviderAdapter: preserves businessName');
    assert(norm.rating === 4.9, 'ProviderAdapter: rounds rating to one decimal place');
    assert(norm.distanceKm === 3.2, 'ProviderAdapter: preserves distanceKm');
    assert(norm.isVerified === true, 'ProviderAdapter: preserves isVerified');
    assert(norm.source === 'MEMBER_4_REPAIR', 'ProviderAdapter: labels source correctly');

    let threw = false;
    try {
      normalizeProvider(null);
    } catch {
      threw = true;
    }
    assert(threw, 'ProviderAdapter: throws on null input');
  } catch (err: any) {
    assert(false, `ProviderAdapter normalize threw: ${err.message}`);
  }

  // 2.2 queryProviders & filters & pagination
  try {
    const allProv = await ProviderAdapter.queryProviders();
    assert(allProv.length >= 3, 'ProviderAdapter.queryProviders returns seeded providers');

    const searchRes = await ProviderAdapter.queryProviders({ search: 'FixIt' });
    assert(searchRes.length === 1 && searchRes[0].businessName.includes('FixIt'), 'ProviderAdapter filters by keyword');

    const catRes = await ProviderAdapter.queryProviders({ category: 'Laptop' });
    assert(catRes.length >= 1, 'ProviderAdapter filters by category');

    const ratingRes = await ProviderAdapter.queryProviders({ minRating: 4.8 });
    assert(ratingRes.every((p) => p.rating >= 4.8), 'ProviderAdapter filters by minRating');

    const distRes = await ProviderAdapter.queryProviders({ maxDistanceKm: 3.0 });
    assert(distRes.every((p) => (p.distanceKm || 0) <= 3.0), 'ProviderAdapter filters by maxDistanceKm');

    // Provider Pagination: page 1 vs page 2
    const provPage1 = await ProviderAdapter.queryProviders({ page: 1, limit: 1 });
    const provPage2 = await ProviderAdapter.queryProviders({ page: 2, limit: 1 });
    assert(provPage1.length === 1, 'ProviderAdapter respects limit for page 1');
    assert(provPage2.length === 1, 'ProviderAdapter respects limit for page 2');
    assert(provPage1[0].id !== provPage2[0].id, 'ProviderAdapter page 1 and page 2 return distinct non-overlapping providers');

    // Dynamic distance calculation with GPS coords
    const provWithCoords = await ProviderAdapter.queryProviders({
      latitude: 40.7128,
      longitude: -74.006,
      radiusKm: 5,
    });
    assert(provWithCoords.length >= 1, 'ProviderAdapter: computes GPS distance and filters by radius');

    const single = await ProviderAdapter.getProviderById('prov_fixit_001');
    assert(single !== null && single.businessName.includes('FixIt'), 'ProviderAdapter.getProviderById finds provider');

    const missing = await ProviderAdapter.getProviderById('non_existent');
    assert(missing === null, 'ProviderAdapter.getProviderById returns null on missing');
  } catch (err: any) {
    assert(false, `ProviderAdapter query threw: ${err.message}`);
  }

  // ==========================================================================
  // 3. LISTING ADAPTER (MEMBER 5)
  // ==========================================================================
  console.log('\n--- 3. ListingAdapter (Member 5) Tests ---');

  // 3.1 normalizeListing
  try {
    const rawSell = {
      id: 101,
      title: 'ThinkPad X1',
      price: 450.0,
      condition: 'Mint',
    };
    const normSell = normalizeListing(rawSell);
    assert(normSell.id === '101', 'ListingAdapter: converts numeric id to string');
    assert(normSell.actionType === 'SELL', 'ListingAdapter: infers SELL action from price');
    assert(normSell.price === 450.0, 'ListingAdapter: preserves price');
    assert(normSell.source === 'MEMBER_5_MARKETPLACE', 'ListingAdapter: labels source correctly');

    const rawDonate = {
      id: 102,
      title: 'Kids Educational Tablet',
      organization: 'Hope for Kids',
    };
    const normDonate = normalizeListing(rawDonate);
    assert(normDonate.actionType === 'DONATE', 'ListingAdapter: infers DONATE action from organization');
    assert(normDonate.organization === 'Hope for Kids', 'ListingAdapter: preserves organization');
    assert(normDonate.price === null, 'ListingAdapter: sets price to null for donation');

    const rawReuse = { id: 103, title: 'Old Monitor for Parts' };
    const normReuse = normalizeListing(rawReuse);
    assert(normReuse.actionType === 'REUSE', 'ListingAdapter: defaults to REUSE when no price or org');
  } catch (err: any) {
    assert(false, `ListingAdapter normalize threw: ${err.message}`);
  }

  // 3.2 queryListings & filters & pagination
  try {
    const allListings = await ListingAdapter.queryListings();
    assert(allListings.length >= 4, 'ListingAdapter.queryListings returns all seeded listings');

    const sellOnly = await ListingAdapter.queryListings({ actionType: 'SELL' });
    assert(sellOnly.every((l) => l.actionType === 'SELL'), 'ListingAdapter filters by actionType SELL');

    const donateOnly = await ListingAdapter.queryListings({ actionType: 'DONATE' });
    assert(donateOnly.every((l) => l.actionType === 'DONATE'), 'ListingAdapter filters by actionType DONATE');

    const priceFilter = await ListingAdapter.queryListings({ minPrice: 200, maxPrice: 600 });
    assert(priceFilter.every((l) => l.price !== null && l.price !== undefined && l.price >= 200 && l.price <= 600), 'ListingAdapter filters by price range');

    // Condition filter
    const condListings = await ListingAdapter.queryListings({ condition: 'Like New' });
    assert(condListings.length >= 1 && condListings[0].condition === 'Like New', 'ListingAdapter filters by condition');

    // Pagination: page 1 vs page 2
    const listPage1 = await ListingAdapter.queryListings({ page: 1, limit: 1 });
    const listPage2 = await ListingAdapter.queryListings({ page: 2, limit: 1 });
    assert(listPage1.length === 1, 'ListingAdapter respects limit for page 1');
    assert(listPage2.length === 1, 'ListingAdapter respects limit for page 2');
    assert(listPage1[0].id !== listPage2[0].id, 'ListingAdapter page 1 and page 2 return distinct non-overlapping listings');

    const single = await ListingAdapter.getListingById('sell_macbook_01');
    assert(single !== null && single.title.includes('MacBook'), 'ListingAdapter.getListingById finds listing');
  } catch (err: any) {
    assert(false, `ListingAdapter queryListings threw: ${err.message}`);
  }

  // ==========================================================================
  // 4. RECYCLING ADAPTER (MEMBER 5)
  // ==========================================================================
  console.log('\n--- 4. RecyclingAdapter (Member 5) Tests ---');

  // 4.1 normalizeRecyclingRequest
  try {
    const raw = {
      id: 5,
      userId: 'usr_rec_10',
      itemType: 'Swollen Li-ion battery',
      description: 'MacBook A1398 battery hazardous pickup',
      quantity: 1,
      pickupAddress: '124 Green St, Apt 2',
      pickupDate: '2026-10-10',
      status: 'PENDING',
    };
    const norm = normalizeRecyclingRequest(raw);
    assert(norm.id === '5', 'RecyclingAdapter: converts id to string');
    assert(norm.itemType === 'Swollen Li-ion battery', 'RecyclingAdapter: preserves itemType');
    assert(norm.quantity === 1, 'RecyclingAdapter: preserves quantity');
    assert(norm.pickupAddress === '124 Green St, Apt 2', 'RecyclingAdapter: preserves pickupAddress');
    assert(norm.status === 'PENDING', 'RecyclingAdapter: preserves status');
    assert(norm.source === 'MEMBER_5_RECYCLING', 'RecyclingAdapter: labels source correctly');

    let threw = false;
    try {
      normalizeRecyclingRequest(null);
    } catch {
      threw = true;
    }
    assert(threw, 'RecyclingAdapter: throws on null input');
  } catch (err: any) {
    assert(false, `RecyclingAdapter normalize threw: ${err.message}`);
  }

  // 4.2 queryRecyclingRequests & filters & pagination
  try {
    const allRequests = await RecyclingAdapter.queryRecyclingRequests();
    assert(allRequests.length >= 2, 'RecyclingAdapter.queryRecyclingRequests returns requests');

    const batterySearch = await RecyclingAdapter.queryRecyclingRequests({ search: 'Battery' });
    assert(batterySearch.length >= 1 && batterySearch[0].id === 'recycle_kiosk_01', 'RecyclingAdapter filters by search');

    const scheduled = await RecyclingAdapter.queryRecyclingRequests({ status: 'SCHEDULED' });
    assert(scheduled.length >= 1 && scheduled[0].status === 'SCHEDULED', 'RecyclingAdapter filters by status');

    // Recycling Pagination: page 1 vs page 2
    const recPage1 = await RecyclingAdapter.queryRecyclingRequests({ page: 1, limit: 1 });
    const recPage2 = await RecyclingAdapter.queryRecyclingRequests({ page: 2, limit: 1 });
    assert(recPage1.length === 1, 'RecyclingAdapter respects limit for page 1');
    assert(recPage2.length === 1, 'RecyclingAdapter respects limit for page 2');
    assert(recPage1[0].id !== recPage2[0].id, 'RecyclingAdapter page 1 and page 2 return distinct non-overlapping requests');

    const single = await RecyclingAdapter.getRecyclingRequestById('recycle_kiosk_01');
    assert(single !== null && single.itemType.includes('Lithium'), 'RecyclingAdapter.getRecyclingRequestById finds item');
  } catch (err: any) {
    assert(false, `RecyclingAdapter query threw: ${err.message}`);
  }

  console.log(`\n=== ADAPTER TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAdapterTests();
}
