// ============================================================================
// Member 3 - Haversine Distance Calculation Utility
// Calculates great-circle distance between two geographic coordinates
// ============================================================================

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula (mean Earth radius = 6371 km).
 *
 * Formula:
 *   a = sin²(Δφ / 2) + cos(φ1) * cos(φ2) * sin²(Δλ / 2)
 *   c = 2 * atan2(√a, √(1 - a))
 *   d = R * c
 *
 * @param lat1 Latitude of origin point (-90 to 90)
 * @param lon1 Longitude of origin point (-180 to 180)
 * @param lat2 Latitude of destination point (-90 to 90)
 * @param lon2 Longitude of destination point (-180 to 180)
 * @returns Distance in kilometers rounded to one decimal place, or null if coordinates are invalid.
 */
export function calculateHaversineDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (
    lat1 === undefined ||
    lat1 === null ||
    typeof lat1 !== 'number' ||
    isNaN(lat1) ||
    lon1 === undefined ||
    lon1 === null ||
    typeof lon1 !== 'number' ||
    isNaN(lon1) ||
    lat2 === undefined ||
    lat2 === null ||
    typeof lat2 !== 'number' ||
    isNaN(lat2) ||
    lon2 === undefined ||
    lon2 === null ||
    typeof lon2 !== 'number' ||
    isNaN(lon2)
  ) {
    return null;
  }

  // Validate latitude range [-90, 90] and longitude range [-180, 180]
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    return null;
  }
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    return null;
  }

  const R = 6371; // Earth's mean radius in km
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  // Guard against floating point errors exceeding 1
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}
