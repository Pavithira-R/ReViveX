// ============================================================================
// Member 3 - Integration Adapters Test Suite
// Verifies normalization, filtering, delegation, and error handling for cross-member data
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
  // 1. ITEM ADAPTER (MEMBER 2)
  // ==========================================================================
  console.log('--- 1. ItemAdapter (Member 2) Tests ---');

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
    const allItems = await ItemAdapter.queryItems();
    assert(Array.isArray(allItems) && allItems.length >= 3, 'ItemAdapter.queryItems returns seeded items');

    const searchResults = await ItemAdapter.queryItems({ search: 'ThinkPad' });
    assert(searchResults.length === 1 && searchResults[0].brand === 'Lenovo', 'ItemAdapter.queryItems filters by search');

    const donateResults = await ItemAdapter.queryItems({ action: 'DONATE' });
    assert(donateResults.length >= 1 && donateResults[0].action === 'DONATE', 'ItemAdapter.queryItems filters by action');

    const paged = await ItemAdapter.queryItems({ page: 1, limit: 1 });
    assert(paged.length === 1, 'ItemAdapter.queryItems respects pagination limit');

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
      id: 'prov_test_01',
      name: 'Bob Fixer',
      businessName: 'Apex Circuit Repairs',
      description: 'Specializes in board level microsoldering and drone repairs.',
      servicesOffered: ['Microsoldering', 'Drone Diagnostics'],
      availability: 'Mon - Fri: 8:00 AM - 5:00 PM',
      location: 'Uptown Tech Park, Suite 4',
      distanceKm: 1.5,
      rating: 4.95,
      reviewCount: 38,
      startingPrice: 50.0,
      currency: 'USD',
      isVerified: true,
      profileImage: 'https://example.com/avatar.jpg',
      phoneNumber: '+1-555-4321',
      email: 'bob@apex.test',
    };
    const norm = normalizeProvider(raw);
    assert(norm.id === 'prov_test_01', 'ProviderAdapter: preserves id');
    assert(norm.businessName === 'Apex Circuit Repairs', 'ProviderAdapter: preserves businessName');
    assert(norm.rating === 5.0, 'ProviderAdapter: rounds rating to one decimal place');
    assert(norm.distanceKm === 1.5, 'ProviderAdapter: preserves distanceKm');
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
    assert(false, `ProviderAdapter normalizeProvider threw: ${err.message}`);
  }

  // 2.2 queryProviders & filters
  try {
    const allProviders = await ProviderAdapter.queryProviders();
    assert(Array.isArray(allProviders) && allProviders.length >= 3, 'ProviderAdapter.queryProviders returns seeded providers');

    const searchResults = await ProviderAdapter.queryProviders({ search: 'MacBook' });
    assert(searchResults.length >= 1 && searchResults.some(p => p.id === 'prov_fixit_001'), 'ProviderAdapter filters by keyword');

    const categoryResults = await ProviderAdapter.queryProviders({ category: 'Audio' });
    assert(categoryResults.length >= 1 && categoryResults[0].id === 'prov_eco_002', 'ProviderAdapter filters by category');

    const highRated = await ProviderAdapter.queryProviders({ minRating: 4.8 });
    assert(highRated.every(p => p.rating >= 4.8), 'ProviderAdapter filters by minRating');

    const nearby = await ProviderAdapter.queryProviders({ maxDistanceKm: 3.0 });
    assert(nearby.every(p => p.distanceKm! <= 3.0), 'ProviderAdapter filters by maxDistanceKm');

    const single = await ProviderAdapter.getProviderById('prov_fixit_001');
    assert(single !== null && single.businessName === 'FixIt Pro Electronics', 'ProviderAdapter.getProviderById finds provider');

    const missing = await ProviderAdapter.getProviderById('unknown_prov');
    assert(missing === null, 'ProviderAdapter.getProviderById returns null on missing');
  } catch (err: any) {
    assert(false, `ProviderAdapter queryProviders threw: ${err.message}`);
  }

  // ==========================================================================
  // 3. LISTING ADAPTER (MEMBER 5)
  // ==========================================================================
  console.log('\n--- 3. ListingAdapter (Member 5) Tests ---');

  // 3.1 normalizeListing - Sell, Donate, Reuse
  try {
    const rawSell = {
      id: 1,
      userId: 'usr_s01',
      title: 'iPad Mini 6',
      description: 'Purple 64GB WiFi.',
      category: 'Tablets',
      condition: 'Like New',
      price: 320,
    };
    const normSell = normalizeListing(rawSell);
    assert(normSell.id === '1', 'ListingAdapter: converts numeric id to string');
    assert(normSell.actionType === 'SELL', 'ListingAdapter: infers SELL action from price');
    assert(normSell.price === 320, 'ListingAdapter: preserves price');
    assert(normSell.source === 'MEMBER_5_MARKETPLACE', 'ListingAdapter: labels source correctly');

    const rawDonate = {
      id: 'don_2',
      userId: 'usr_d01',
      title: 'Free Chromebook',
      category: 'Laptops',
      organization: 'Lincoln High School',
    };
    const normDonate = normalizeListing(rawDonate);
    assert(normDonate.actionType === 'DONATE', 'ListingAdapter: infers DONATE action from organization');
    assert(normDonate.organization === 'Lincoln High School', 'ListingAdapter: preserves organization');
    assert(normDonate.price === null, 'ListingAdapter: sets price to null for donation');

    const rawReuse = {
      id: 'reu_3',
      userId: 'usr_r01',
      title: 'Old CRT Monitor for retro gaming',
      category: 'Monitors',
    };
    const normReuse = normalizeListing(rawReuse);
    assert(normReuse.actionType === 'REUSE', 'ListingAdapter: defaults to REUSE when no price or org');
  } catch (err: any) {
    assert(false, `ListingAdapter normalizeListing threw: ${err.message}`);
  }

  // 3.2 queryListings & filters
  try {
    const allListings = await ListingAdapter.queryListings();
    assert(allListings.length >= 3, 'ListingAdapter.queryListings returns all seeded listings');

    const sellOnly = await ListingAdapter.queryListings({ actionType: 'SELL' });
    assert(sellOnly.every(l => l.actionType === 'SELL'), 'ListingAdapter filters by actionType SELL');

    const donateOnly = await ListingAdapter.queryListings({ actionType: 'DONATE' });
    assert(donateOnly.every(l => l.actionType === 'DONATE'), 'ListingAdapter filters by actionType DONATE');

    const priceFiltered = await ListingAdapter.queryListings({ minPrice: 200, maxPrice: 600 });
    assert(
      priceFiltered.every(
        (l) => typeof l.price === 'number' && l.price >= 200 && l.price <= 600
      ),
      'ListingAdapter filters by price range'
    );

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

  // 4.2 queryRecyclingRequests & filters
  try {
    const allRequests = await RecyclingAdapter.queryRecyclingRequests();
    assert(allRequests.length >= 2, 'RecyclingAdapter.queryRecyclingRequests returns requests');

    const batterySearch = await RecyclingAdapter.queryRecyclingRequests({ search: 'Battery' });
    assert(batterySearch.length >= 1 && batterySearch[0].id === 'recycle_kiosk_01', 'RecyclingAdapter filters by search');

    const scheduled = await RecyclingAdapter.queryRecyclingRequests({ status: 'SCHEDULED' });
    assert(scheduled.length >= 1 && scheduled[0].status === 'SCHEDULED', 'RecyclingAdapter filters by status');

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
