// ============================================================================
// Member 4 - Provider Validator (Phase 1)
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateProviderQuery = (query: { category?: string; search?: string }): ValidationResult => {
  const errors: string[] = [];
  if (query.search && query.search.trim().length > 100) {
    errors.push('Search query cannot exceed 100 characters');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateProviderId = (id?: string): ValidationResult => {
  const errors: string[] = [];
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    errors.push('A valid Provider ID is required');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};
