// ============================================================================
// Member 3 - Location Utilities
// Haversine calculation, coordinate validation, and distance formatting
// ============================================================================

import { LocationCoordinates, CityPreset, LocationSource } from '../types';

export const EARTH_RADIUS_KM = 6371;

/**
 * Curated Sri Lankan city presets for Tier 3 manual location selection
 */
export const SRI_LANKA_CITY_PRESETS: CityPreset[] = [
  {
    id: 'city_cmb',
    name: 'Colombo',
    district: 'Colombo',
    province: 'Western',
    coordinates: { latitude: 6.9271, longitude: 79.8612 },
  },
  {
    id: 'city_kdy',
    name: 'Kandy',
    district: 'Kandy',
    province: 'Central',
    coordinates: { latitude: 7.2906, longitude: 80.6337 },
  },
  {
    id: 'city_gle',
    name: 'Galle',
    district: 'Galle',
    province: 'Southern',
    coordinates: { latitude: 6.0535, longitude: 80.221 },
  },
  {
    id: 'city_jaf',
    name: 'Jaffna',
    district: 'Jaffna',
    province: 'Northern',
    coordinates: { latitude: 9.6615, longitude: 80.0255 },
  },
  {
    id: 'city_gmp',
    name: 'Gampaha',
    district: 'Gampaha',
    province: 'Western',
    coordinates: { latitude: 7.084, longitude: 79.9925 },
  },
  {
    id: 'city_neg',
    name: 'Negombo',
    district: 'Gampaha',
    province: 'Western',
    coordinates: { latitude: 7.2008, longitude: 79.8736 },
  },
  {
    id: 'city_kur',
    name: 'Kurunegala',
    district: 'Kurunegala',
    province: 'North Western',
    coordinates: { latitude: 7.4818, longitude: 80.3609 },
  },
  {
    id: 'city_mat',
    name: 'Matara',
    district: 'Matara',
    province: 'Southern',
    coordinates: { latitude: 5.9549, longitude: 80.555 },
  },
  {
    id: 'city_anu',
    name: 'Anuradhapura',
    district: 'Anuradhapura',
    province: 'North Central',
    coordinates: { latitude: 8.3114, longitude: 80.4037 },
  },
  {
    id: 'city_bat',
    name: 'Batticaloa',
    district: 'Batticaloa',
    province: 'Eastern',
    coordinates: { latitude: 7.731, longitude: 81.6747 },
  },
  {
    id: 'city_tri',
    name: 'Trincomalee',
    district: 'Trincomalee',
    province: 'Eastern',
    coordinates: { latitude: 8.5874, longitude: 81.2152 },
  },
  {
    id: 'city_rat',
    name: 'Ratnapura',
    district: 'Ratnapura',
    province: 'Sabaragamuwa',
    coordinates: { latitude: 6.6828, longitude: 80.4034 },
  },
];

/**
 * Finds the closest preset city given a coordinate point
 */
export function findNearestCityPreset(coords: LocationCoordinates): CityPreset {
  let nearest = SRI_LANKA_CITY_PRESETS[0];
  let minDistance = Infinity;

  for (const city of SRI_LANKA_CITY_PRESETS) {
    const dist = calculateHaversineDistanceKm(
      coords.latitude,
      coords.longitude,
      city.coordinates.latitude,
      city.coordinates.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return nearest;
}

/**
 * Formats the location source for display
 */
export function formatLocationSourceLabel(source: LocationSource): string {
  switch (source) {
    case 'GPS':
      return 'GPS (Live)';
    case 'PROFILE':
      return 'Profile (Saved)';
    case 'MANUAL':
      return 'Manual';
    default:
      return 'Nearby';
  }
}

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
