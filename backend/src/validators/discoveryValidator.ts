// ============================================================================
// Member 3 - Discovery Feed Query Validator
// Validates query parameters for GET /api/discovery/feed
// ============================================================================

import { DiscoveryQueryParams, DiscoveryValidationResult } from '../types/discovery.types';

export function validateDiscoveryQuery(params: DiscoveryQueryParams): DiscoveryValidationResult {
  const errors: string[] = [];
  let sectionLimit = 4; // Approved default
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;
  let radiusKm: number | undefined = undefined;

  // 1. sectionLimit validation
  if (params.sectionLimit !== undefined && params.sectionLimit !== null && params.sectionLimit !== '') {
    const rawVal = params.sectionLimit;
    const parsed = Number(rawVal);

    if (isNaN(parsed) || !Number.isInteger(parsed)) {
      errors.push("Parameter 'sectionLimit' must be a valid integer between 1 and 20.");
    } else if (parsed < 1) {
      errors.push("Parameter 'sectionLimit' must be greater than or equal to 1.");
    } else if (parsed > 20) {
      errors.push("Parameter 'sectionLimit' must not exceed 20.");
    } else {
      sectionLimit = parsed;
    }
  }

  // 2. Spatial GPS Coordinates Validation
  const hasLat = params.latitude !== undefined && params.latitude !== null && params.latitude !== '';
  const hasLng = params.longitude !== undefined && params.longitude !== null && params.longitude !== '';

  if (hasLat && !hasLng) {
    errors.push("Missing 'longitude'. When filtering by location, both 'latitude' and 'longitude' must be provided.");
  } else if (!hasLat && hasLng) {
    errors.push("Missing 'latitude'. When filtering by location, both 'latitude' and 'longitude' must be provided.");
  } else if (hasLat && hasLng) {
    const parsedLat = Number(params.latitude);
    const parsedLng = Number(params.longitude);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.push("Parameter 'latitude' must be a valid number between -90 and 90.");
    } else {
      latitude = parsedLat;
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.push("Parameter 'longitude' must be a valid number between -180 and 180.");
    } else {
      longitude = parsedLng;
    }
  }

  // 3. Radius Validation
  if (params.radiusKm !== undefined && params.radiusKm !== null && params.radiusKm !== '') {
    const parsedRadius = Number(params.radiusKm);
    if (isNaN(parsedRadius) || parsedRadius <= 0 || parsedRadius > 500) {
      errors.push("Parameter 'radiusKm' must be a positive number greater than 0 and at most 500.");
    } else {
      radiusKm = parsedRadius;
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    validatedQuery: {
      sectionLimit,
      latitude,
      longitude,
      radiusKm,
    },
  };
}
