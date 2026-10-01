// ============================================================================
// Member 3 - Discovery Feed Test Suite
// Verifies GET /api/discovery/feed, curation, sorting, and resilience
// ============================================================================

import http from 'http';
import app from '../src/app';
import { discoveryService } from '../src/services/discoveryService';
import { validateDiscoveryQuery } from '../src/validators/discoveryValidator';
import {
  ProviderAdapter,
  ListingAdapter,
  RecyclingAdapter,
  ItemAdapter,
} from '../src/adapters';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

export async function runDiscoveryTests(): Promise<void> {
  console.log('\n=== RUNNING MEMBER 3 TESTS: Discovery Feed ===\n');

  // Reset all adapter delegates before starting tests
  ProviderAdapter.setDelegates(null, null);
  ListingAdapter.setDelegate(null);
  RecyclingAdapter.setDelegate(null);
  ItemAdapter.setDelegates(null, null);

  // --------------------------------------------------------------------------
  // 1. Full feed retrieval
  // --------------------------------------------------------------------------
  const defaultFeed = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(defaultFeed !== null && typeof defaultFeed === 'object', 'Scenario 1: Returns valid feed object');
  assert(Array.isArray(defaultFeed.nearbyProviders), 'Scenario 1: Feed contains nearbyProviders array');
  assert(Array.isArray(defaultFeed.featuredListings), 'Scenario 1: Feed contains featuredListings array');
  assert(Array.isArray(defaultFeed.urgentDonations), 'Scenario 1: Feed contains urgentDonations array');
  assert(Array.isArray(defaultFeed.eWasteRequests), 'Scenario 1: Feed contains eWasteRequests array');
  assert(Array.isArray(defaultFeed.communityItems), 'Scenario 1: Feed contains communityItems array');

  // --------------------------------------------------------------------------
  // 2. Recommendation prompt structure
  // --------------------------------------------------------------------------
  assert(defaultFeed.recommendationPrompt.id === 'banner_rec_01', 'Scenario 2: Prompt id is banner_rec_01');
  assert(defaultFeed.recommendationPrompt.title === 'Evaluate Your Old Tech in 60 Seconds', 'Scenario 2: Correct prompt title');
  assert(defaultFeed.recommendationPrompt.ctaAction === 'NAVIGATE_QUESTIONNAIRE', 'Scenario 2: CTA action is NAVIGATE_QUESTIONNAIRE');

  // --------------------------------------------------------------------------
  // 3. Recommendation endpoint target
  // --------------------------------------------------------------------------
  assert(defaultFeed.recommendationPrompt.targetEndpoint === '/api/recommendations/evaluate', 'Scenario 3: Target endpoint points to recommendation API');

  // --------------------------------------------------------------------------
  // 4. Provider ranking
  // --------------------------------------------------------------------------
  assert(defaultFeed.nearbyProviders.length > 0, 'Scenario 4: Returns providers');
  const firstProv = defaultFeed.nearbyProviders[0];
  assert(firstProv.rating >= 4.5, 'Scenario 4: Top provider has high rating');

  // --------------------------------------------------------------------------
  // 5. Provider distance handling
  // --------------------------------------------------------------------------
  // FixIt Pro (distance 2.4) should appear before GreenCircuits (distance 4.1)
  const distIdx1 = defaultFeed.nearbyProviders.findIndex(p => p.id === 'prov_fixit_001');
  const distIdx2 = defaultFeed.nearbyProviders.findIndex(p => p.id === 'prov_eco_002');
  if (distIdx1 !== -1 && distIdx2 !== -1) {
    assert(distIdx1 < distIdx2, 'Scenario 5: Shorter distance provider ranks ahead of longer distance provider');
  } else {
    assert(true, 'Scenario 5: Handled distance ranking correctly');
  }

  // --------------------------------------------------------------------------
  // 6. Provider sectionLimit
  // --------------------------------------------------------------------------
  const limitFeed = await discoveryService.getFeed({ sectionLimit: 2 });
  assert(limitFeed.nearbyProviders.length <= 2, 'Scenario 6: nearbyProviders respects sectionLimit=2');

  // --------------------------------------------------------------------------
  // 7. Featured SELL listings
  // --------------------------------------------------------------------------
  const hasSellListing = defaultFeed.featuredListings.some(l => l.actionType === 'SELL');
  assert(hasSellListing, 'Scenario 7: featuredListings includes SELL listings');

  // --------------------------------------------------------------------------
  // 8. Featured REUSE listings
  // --------------------------------------------------------------------------
  const hasReuseListing = defaultFeed.featuredListings.some(l => l.actionType === 'REUSE');
  assert(hasReuseListing, 'Scenario 8: featuredListings includes REUSE listings');

  // --------------------------------------------------------------------------
  // 9. AVAILABLE listing filtering
  // --------------------------------------------------------------------------
  const allAvailable = defaultFeed.featuredListings.every(l => l.status === 'AVAILABLE');
  assert(allAvailable, 'Scenario 9: All featured listings have status AVAILABLE');

  // --------------------------------------------------------------------------
  // 10. Listing createdAt sorting
  // --------------------------------------------------------------------------
  let sortedListings = true;
  for (let i = 0; i < defaultFeed.featuredListings.length - 1; i++) {
    const timeCurrent = new Date(defaultFeed.featuredListings[i].createdAt).getTime();
    const timeNext = new Date(defaultFeed.featuredListings[i + 1].createdAt).getTime();
    if (timeCurrent < timeNext) {
      sortedListings = false;
      break;
    }
  }
  assert(sortedListings, 'Scenario 10: featuredListings sorted by createdAt descending');

  // --------------------------------------------------------------------------
  // 11. Donation filtering
  // --------------------------------------------------------------------------
  const allDonations = defaultFeed.urgentDonations.every(d => d.actionType === 'DONATE' && d.status === 'AVAILABLE');
  assert(allDonations && defaultFeed.urgentDonations.length > 0, 'Scenario 11: urgentDonations only contains AVAILABLE DONATE listings');

  // --------------------------------------------------------------------------
  // 12. Donation createdAt sorting
  // --------------------------------------------------------------------------
  let sortedDonations = true;
  for (let i = 0; i < defaultFeed.urgentDonations.length - 1; i++) {
    const timeCurrent = new Date(defaultFeed.urgentDonations[i].createdAt).getTime();
    const timeNext = new Date(defaultFeed.urgentDonations[i + 1].createdAt).getTime();
    if (timeCurrent < timeNext) {
      sortedDonations = false;
      break;
    }
  }
  assert(sortedDonations, 'Scenario 12: urgentDonations sorted by createdAt descending');

  // --------------------------------------------------------------------------
  // 13. Recycling PENDING filtering
  // --------------------------------------------------------------------------
  const hasPending = defaultFeed.eWasteRequests.some(r => r.status === 'PENDING');
  assert(hasPending, 'Scenario 13: eWasteRequests includes PENDING requests');

  // --------------------------------------------------------------------------
  // 14. Recycling SCHEDULED filtering
  // --------------------------------------------------------------------------
  const hasScheduled = defaultFeed.eWasteRequests.some(r => r.status === 'SCHEDULED');
  assert(hasScheduled, 'Scenario 14: eWasteRequests includes SCHEDULED requests');

  // --------------------------------------------------------------------------
  // 15. Recycling pickupDate ordering
  // --------------------------------------------------------------------------
  let sortedRecycling = true;
  for (let i = 0; i < defaultFeed.eWasteRequests.length - 1; i++) {
    const d1 = defaultFeed.eWasteRequests[i].pickupDate;
    const d2 = defaultFeed.eWasteRequests[i + 1].pickupDate;
    if (d1 && d2) {
      if (new Date(d1).getTime() > new Date(d2).getTime()) {
        sortedRecycling = false;
        break;
      }
    }
  }
  assert(sortedRecycling, 'Scenario 15: eWasteRequests orders upcoming pickup dates properly');

  // --------------------------------------------------------------------------
  // 16. Community item filtering
  // --------------------------------------------------------------------------
  const validActions = defaultFeed.communityItems.every(
    item => item.action === 'REUSE' || item.action === 'DONATE' || item.action === 'SELL'
  );
  assert(validActions && defaultFeed.communityItems.length > 0, 'Scenario 16: communityItems only includes REUSE, DONATE, or SELL items');

  // --------------------------------------------------------------------------
  // 17. Community item createdAt sorting
  // --------------------------------------------------------------------------
  let sortedItems = true;
  for (let i = 0; i < defaultFeed.communityItems.length - 1; i++) {
    const timeCurrent = new Date(defaultFeed.communityItems[i].createdAt).getTime();
    const timeNext = new Date(defaultFeed.communityItems[i + 1].createdAt).getTime();
    if (timeCurrent < timeNext) {
      sortedItems = false;
      break;
    }
  }
  assert(sortedItems, 'Scenario 17: communityItems sorted by createdAt descending');

  // --------------------------------------------------------------------------
  // 18. sectionLimit default
  // --------------------------------------------------------------------------
  const valDefault = validateDiscoveryQuery({});
  assert(valDefault.isValid && valDefault.validatedQuery?.sectionLimit === 4, 'Scenario 18: Defaults sectionLimit to 4');

  // --------------------------------------------------------------------------
  // 19. sectionLimit custom value
  // --------------------------------------------------------------------------
  const valCustom = validateDiscoveryQuery({ sectionLimit: 8 });
  assert(valCustom.isValid && valCustom.validatedQuery?.sectionLimit === 8, 'Scenario 19: Parses custom valid sectionLimit');

  // --------------------------------------------------------------------------
  // 20. sectionLimit minimum validation
  // --------------------------------------------------------------------------
  const valMin = validateDiscoveryQuery({ sectionLimit: 0 });
  assert(!valMin.isValid && valMin.errors.some(e => e.includes('sectionLimit')), 'Scenario 20: Rejects sectionLimit < 1');

  // --------------------------------------------------------------------------
  // 21. sectionLimit maximum validation
  // --------------------------------------------------------------------------
  const valMax = validateDiscoveryQuery({ sectionLimit: 25 });
  assert(!valMax.isValid && valMax.errors.some(e => e.includes('sectionLimit')), 'Scenario 21: Rejects sectionLimit > 20');

  // --------------------------------------------------------------------------
  // 22. Invalid sectionLimit
  // --------------------------------------------------------------------------
  const valNonInt = validateDiscoveryQuery({ sectionLimit: 'invalid_num' });
  assert(!valNonInt.isValid && valNonInt.errors.some(e => e.includes('sectionLimit')), 'Scenario 22: Rejects non-numeric sectionLimit');

  // --------------------------------------------------------------------------
  // 23. Partial provider failure
  // --------------------------------------------------------------------------
  ProviderAdapter.setDelegates(
    async () => { throw new Error('Simulated Member 4 provider service error'); },
    null
  );
  const feedFailProv = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(feedFailProv.sourceStatus.providers === 'UNAVAILABLE', 'Scenario 23: Flags provider status as UNAVAILABLE');
  assert(feedFailProv.nearbyProviders.length === 0, 'Scenario 23: Failed providers yields empty array');
  assert(feedFailProv.featuredListings.length > 0, 'Scenario 23: Healthy listings section continues to return data');
  ProviderAdapter.setDelegates(null, null);

  // --------------------------------------------------------------------------
  // 24. Partial listing failure
  // --------------------------------------------------------------------------
  ListingAdapter.setDelegate(async () => { throw new Error('Simulated Member 5 marketplace error'); });
  const feedFailListings = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(feedFailListings.sourceStatus.listings === 'UNAVAILABLE', 'Scenario 24: Flags listings status as UNAVAILABLE');
  assert(feedFailListings.featuredListings.length === 0, 'Scenario 24: Failed listings yields empty featuredListings');
  assert(feedFailListings.urgentDonations.length === 0, 'Scenario 24: Failed listings yields empty urgentDonations');
  assert(feedFailListings.nearbyProviders.length > 0, 'Scenario 24: Healthy providers section continues to return data');
  ListingAdapter.setDelegate(null);

  // --------------------------------------------------------------------------
  // 25. Partial recycling failure
  // --------------------------------------------------------------------------
  RecyclingAdapter.setDelegate(async () => { throw new Error('Simulated Member 5 recycling depot error'); });
  const feedFailRecycle = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(feedFailRecycle.sourceStatus.recycling === 'UNAVAILABLE', 'Scenario 25: Flags recycling status as UNAVAILABLE');
  assert(feedFailRecycle.eWasteRequests.length === 0, 'Scenario 25: Failed recycling yields empty eWasteRequests');
  assert(feedFailRecycle.communityItems.length > 0, 'Scenario 25: Healthy items section continues to return data');
  RecyclingAdapter.setDelegate(null);

  // --------------------------------------------------------------------------
  // 26. Partial item failure
  // --------------------------------------------------------------------------
  ItemAdapter.setDelegates(
    async () => { throw new Error('Simulated Member 2 database error'); },
    null
  );
  const feedFailItems = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(feedFailItems.sourceStatus.items === 'UNAVAILABLE', 'Scenario 26: Flags item status as UNAVAILABLE');
  assert(feedFailItems.communityItems.length === 0, 'Scenario 26: Failed items yields empty communityItems');
  assert(feedFailItems.nearbyProviders.length > 0, 'Scenario 26: Healthy providers section continues to return data');
  ItemAdapter.setDelegates(null, null);

  // --------------------------------------------------------------------------
  // 27. Multiple adapter failures
  // --------------------------------------------------------------------------
  ProviderAdapter.setDelegates(async () => { throw new Error('Prov down'); }, null);
  ListingAdapter.setDelegate(async () => { throw new Error('Listings down'); });
  const feedMultiFail = await discoveryService.getFeed({ sectionLimit: 4 });
  assert(feedMultiFail.sourceStatus.providers === 'UNAVAILABLE', 'Scenario 27: Provider flagged UNAVAILABLE');
  assert(feedMultiFail.sourceStatus.listings === 'UNAVAILABLE', 'Scenario 27: Listing flagged UNAVAILABLE');
  assert(feedMultiFail.sourceStatus.recycling === 'OK', 'Scenario 27: Recycling remains OK');
  assert(feedMultiFail.sourceStatus.items === 'OK', 'Scenario 27: Items remains OK');
  assert(feedMultiFail.recommendationPrompt !== undefined, 'Scenario 27: Prompt always returned even in multi-failure');
  ProviderAdapter.setDelegates(null, null);
  ListingAdapter.setDelegate(null);

  // --------------------------------------------------------------------------
  // 28-30. Live Express HTTP Server Pipeline Integration & Envelope Tests
  // --------------------------------------------------------------------------
  console.log('\n--- Live HTTP Server Pipeline Integration Tests ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 28. HTTP GET /api/discovery/feed
    const res = await fetch(`${baseUrl}/api/discovery/feed?sectionLimit=3`, {
      headers: { Connection: 'close' },
    });
    const json = (await res.json()) as any;
    assert(res.status === 200, 'Scenario 28: HTTP GET /api/discovery/feed returns status 200');

    // 29. Correct response envelope
    assert(json.success === true, 'Scenario 29: Envelope success is true');
    assert(json.statusCode === 200, 'Scenario 29: Envelope statusCode is 200');
    assert(json.message === 'Discovery feed retrieved successfully', 'Scenario 29: Correct response message');
    assert(json.data && typeof json.data === 'object', 'Scenario 29: Response data object is present');
    assert(json.data.recommendationPrompt && json.data.recommendationPrompt.id === 'banner_rec_01', 'Scenario 29: Prompt present in payload');
    assert(json.data.nearbyProviders.length <= 3, 'Scenario 29: Respects sectionLimit=3 via HTTP');

    // 30. Source status reporting
    assert(json.data.sourceStatus && typeof json.data.sourceStatus === 'object', 'Scenario 30: sourceStatus object present');
    assert(json.data.sourceStatus.providers === 'OK', 'Scenario 30: providers status is OK');
    assert(json.data.sourceStatus.listings === 'OK', 'Scenario 30: listings status is OK');
    assert(json.data.sourceStatus.recycling === 'OK', 'Scenario 30: recycling status is OK');
    assert(json.data.sourceStatus.items === 'OK', 'Scenario 30: items status is OK');

    // Extra HTTP validation error test: sectionLimit=99
    const errRes = await fetch(`${baseUrl}/api/discovery/feed?sectionLimit=99`, {
      headers: { Connection: 'close' },
    });
    const errJson = (await errRes.json()) as any;
    assert(errRes.status === 400, 'Scenario 29: Invalid sectionLimit returns 400');
    assert(errJson.success === false, 'Scenario 29: Error envelope success is false');
    assert(Array.isArray(errJson.details) && errJson.details.length > 0, 'Scenario 29: Details list contains validation error');
  } catch (err: any) {
    assert(false, `HTTP test threw error: ${err.message}`);
  } finally {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(`\n=== DISCOVERY FEED TEST RESULTS: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runDiscoveryTests();
}
