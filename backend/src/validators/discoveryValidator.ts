// ============================================================================
// Member 3 - Discovery Feed Query Validator
// Validates query parameters for GET /api/discovery/feed
// ============================================================================

import { DiscoveryQueryParams, DiscoveryValidationResult } from '../types/discovery.types';

export function validateDiscoveryQuery(params: DiscoveryQueryParams): DiscoveryValidationResult {
  const errors: string[] = [];
  let sectionLimit = 4; // Approved default

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
    },
  };
}
