// ============================================================================
// Member 4 - Repair Request Validator (Phase 2)
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateRepairRequestInput {
  itemId: string;
  customerId: string;
  providerId: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
}

export const validateCreateRepairRequest = (input: Partial<CreateRepairRequestInput>): ValidationResult => {
  const errors: string[] = [];

  if (!input.providerId || typeof input.providerId !== 'string' || input.providerId.trim().length === 0) {
    errors.push('A valid Service Provider ID is required');
  }

  if (!input.itemId || typeof input.itemId !== 'string' || input.itemId.trim().length === 0) {
    errors.push('A valid Item ID is required');
  }

  if (!input.customerId || typeof input.customerId !== 'string' || input.customerId.trim().length === 0) {
    errors.push('Customer identification is required');
  }

  if (!input.problemDescription || typeof input.problemDescription !== 'string' || input.problemDescription.trim().length < 10) {
    errors.push('Problem description must be at least 10 characters long');
  } else if (input.problemDescription.length > 2000) {
    errors.push('Problem description cannot exceed 2000 characters');
  }

  if (!input.preferredDate || typeof input.preferredDate !== 'string') {
    errors.push('Preferred appointment/service date is required');
  } else {
    const parsedDate = new Date(input.preferredDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Preferred date must be a valid ISO date string');
    }
  }

  if (input.notes && input.notes.length > 1000) {
    errors.push('Additional notes cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
