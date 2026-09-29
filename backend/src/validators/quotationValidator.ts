// ============================================================================
// Member 4 - Provider Response & Quotation Validator (Phase 3)
// ============================================================================

import { RepairStatus } from '../types';

export interface ProviderResponseInput {
  action: 'ACCEPT' | 'REJECT';
  estimatedPrice?: number;
  providerNotes?: string;
  rejectionReason?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateProviderResponse = (input: Partial<ProviderResponseInput>): ValidationResult => {
  const errors: string[] = [];

  if (!input.action || (input.action !== 'ACCEPT' && input.action !== 'REJECT')) {
    errors.push("Action must be either 'ACCEPT' or 'REJECT'");
  }

  if (input.action === 'ACCEPT') {
    if (input.estimatedPrice === undefined || input.estimatedPrice === null || typeof input.estimatedPrice !== 'number') {
      errors.push('Estimated price quotation is required when accepting a repair request');
    } else if (input.estimatedPrice < 0) {
      errors.push('Quotation price cannot be negative');
    }
  }

  if (input.action === 'REJECT') {
    if (!input.rejectionReason || typeof input.rejectionReason !== 'string' || input.rejectionReason.trim().length < 5) {
      errors.push('Please provide a reason for rejecting the request (at least 5 characters)');
    }
  }

  if (input.providerNotes && input.providerNotes.length > 1000) {
    errors.push('Provider notes cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
