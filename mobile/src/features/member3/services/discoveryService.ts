// ============================================================================
// Member 3 - Discovery Feed Service
// Queries Cloud Firestore collections directly via fetchFirestoreDiscoveryFeed
// ============================================================================

import { DiscoveryFeedData, LocationCoordinates } from '../types';
import {
  buildDiscoveryFeed,
  fetchFirestoreDiscoveryFeed,
} from './pureSearchAndDiscovery';

export async function fetchDiscoveryFeed(
  coords?: LocationCoordinates
): Promise<{ feed: DiscoveryFeedData; isOfflineFallback: boolean }> {
  const feed = await fetchFirestoreDiscoveryFeed(coords);
  return {
    feed,
    isOfflineFallback: false,
  };
}

export { buildDiscoveryFeed, fetchFirestoreDiscoveryFeed };
