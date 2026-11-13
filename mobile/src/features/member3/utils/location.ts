// ============================================================================
// Member 3 - Location Utilities
// Haversine calculation, coordinate validation, and distance formatting
// ============================================================================

import { LocationCoordinates } from '../types';

export const EARTH_RADIUS_KM = 6371;

/**
 * Validates latitude and longitude within geographic bounds
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Computes Great-Circle distance using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return Infinity;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Formats distance into a clean human-readable badge label
 */
export function formatDistance(distanceKm?: number | null): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'Nearby';
  }
  if (distanceKm < 0.5) {
    return '< 500m away';
  }
  if (distanceKm < 1) {
    return '< 1 km away';
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Default fallback coordinates when GPS permission is not granted
 * (Colombo commercial center: 6.9271, 79.8612)
 */
export const DEFAULT_USER_COORDINATES: LocationCoordinates = {
  latitude: 6.9271,
  longitude: 79.8612,
};
