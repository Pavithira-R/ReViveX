// ============================================================================
// Member 3 - Recommendation Input Validator
// ============================================================================

import {
  DeviceCategory,
  DeviceCondition,
  DeviceAge,
  UserIntention,
  ResolutionUrgency,
  RecommendationInput,
  NormalizedRecommendationInput,
} from '../types/recommendation.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  normalized?: NormalizedRecommendationInput;
}

// Category normalization mapping
const CATEGORY_MAP: Record<string, DeviceCategory> = {
  LAPTOP: 'LAPTOP',
  PHONE: 'PHONE',
  SMARTPHONE: 'PHONE',
  TABLET: 'TABLET',
  DESKTOP: 'DESKTOP',
  MONITOR: 'MONITOR',
  PRINTER: 'PRINTER',
  OTHER: 'OTHER',
};

// Condition normalization mapping
const CONDITION_MAP: Record<string, DeviceCondition> = {
  WORKING_NORMALLY: 'WORKING_NORMALLY',
  'WORKING NORMALLY': 'WORKING_NORMALLY',
  NORMAL: 'WORKING_NORMALLY',
  WORKING: 'WORKING_NORMALLY',

  WORKING_WITH_PROBLEMS: 'WORKING_WITH_PROBLEMS',
  'WORKING WITH PROBLEMS': 'WORKING_WITH_PROBLEMS',
  PROBLEMATIC: 'WORKING_WITH_PROBLEMS',
  MINOR_DEFECTS: 'WORKING_WITH_PROBLEMS',

  NOT_WORKING: 'NOT_WORKING',
  'NOT WORKING': 'NOT_WORKING',
  BROKEN: 'NOT_WORKING',
  NON_FUNCTIONAL: 'NOT_WORKING',

  PHYSICALLY_DAMAGED: 'PHYSICALLY_DAMAGED',
  'PHYSICALLY DAMAGED': 'PHYSICALLY_DAMAGED',
  DAMAGED: 'PHYSICALLY_DAMAGED',
};

// Age normalization mapping
const AGE_MAP: Record<string, DeviceAge> = {
  LESS_THAN_1_YEAR: 'LESS_THAN_1_YEAR',
  'LESS THAN 1 YEAR': 'LESS_THAN_1_YEAR',
  '< 1 YEAR': 'LESS_THAN_1_YEAR',
  '<1 YEAR': 'LESS_THAN_1_YEAR',
  'UNDER 1 YEAR': 'LESS_THAN_1_YEAR',

  ONE_TO_THREE_YEARS: 'ONE_TO_THREE_YEARS',
  '1-3 YEARS': 'ONE_TO_THREE_YEARS',
  '1–3 YEARS': 'ONE_TO_THREE_YEARS',
  '1 TO 3 YEARS': 'ONE_TO_THREE_YEARS',

  THREE_TO_FIVE_YEARS: 'THREE_TO_FIVE_YEARS',
  '3-5 YEARS': 'THREE_TO_FIVE_YEARS',
  '3–5 YEARS': 'THREE_TO_FIVE_YEARS',
  '3 TO 5 YEARS': 'THREE_TO_FIVE_YEARS',

  MORE_THAN_5_YEARS: 'MORE_THAN_5_YEARS',
  'MORE THAN 5 YEARS': 'MORE_THAN_5_YEARS',
  '> 5 YEARS': 'MORE_THAN_5_YEARS',
  '>5 YEARS': 'MORE_THAN_5_YEARS',
  'OVER 5 YEARS': 'MORE_THAN_5_YEARS',
};

// Intention normalization mapping
const INTENTION_MAP: Record<string, UserIntention> = {
  KEEP_USE: 'KEEP_USE',
  'KEEP/USE': 'KEEP_USE',
  'KEEP / USE': 'KEEP_USE',
  KEEP: 'KEEP_USE',
  USE: 'KEEP_USE',

  REPAIR: 'REPAIR',
  FIX: 'REPAIR',

  SELL: 'SELL',
  MONETIZE: 'SELL',

  GIVE_AWAY: 'GIVE_AWAY',
  'GIVE AWAY': 'GIVE_AWAY',
  DONATE: 'GIVE_AWAY',

  DISPOSE_RESPONSIBLY: 'DISPOSE_RESPONSIBLY',
  'DISPOSE RESPONSIBLY': 'DISPOSE_RESPONSIBLY',
  RECYCLE: 'DISPOSE_RESPONSIBLY',
  DISPOSE: 'DISPOSE_RESPONSIBLY',
};

// Urgency normalization mapping
const URGENCY_MAP: Record<string, ResolutionUrgency> = {
  FLEXIBLE: 'FLEXIBLE',
  STANDARD: 'FLEXIBLE',
  NORMAL: 'FLEXIBLE',

  URGENT: 'URGENT',
  HIGH: 'URGENT',
  IMMEDIATE: 'URGENT',
};

/**
 * Validates and normalizes recommendation input payload
 */
export function validateRecommendationInput(input: RecommendationInput): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be a valid JSON object containing recommendation inputs.'],
    };
  }

  // 1. Category validation
  let normalizedCategory: DeviceCategory | undefined;
  if (!input.category || typeof input.category !== 'string' || input.category.trim() === '') {
    errors.push("Field 'category' is required.");
  } else {
    const key = input.category.trim().toUpperCase();
    normalizedCategory = CATEGORY_MAP[key];
    if (!normalizedCategory) {
      errors.push(
        `Invalid category '${input.category}'. Allowed categories: LAPTOP, PHONE, TABLET, DESKTOP, MONITOR, PRINTER, OTHER.`
      );
    }
  }

  // 2. Condition validation
  let normalizedCondition: DeviceCondition | undefined;
  if (!input.condition || typeof input.condition !== 'string' || input.condition.trim() === '') {
    errors.push("Field 'condition' is required.");
  } else {
    const key = input.condition.trim().toUpperCase();
    normalizedCondition = CONDITION_MAP[key];
    if (!normalizedCondition) {
      errors.push(
        `Invalid condition '${input.condition}'. Allowed conditions: WORKING_NORMALLY, WORKING_WITH_PROBLEMS, NOT_WORKING, PHYSICALLY_DAMAGED.`
      );
    }
  }

  // 3. Age validation (checks 'age' and alias 'ageGroup')
  const rawAge = input.age || input.ageGroup;
  let normalizedAge: DeviceAge | undefined;
  if (!rawAge || typeof rawAge !== 'string' || rawAge.trim() === '') {
    errors.push("Field 'age' is required.");
  } else {
    const key = rawAge.trim().toUpperCase();
    normalizedAge = AGE_MAP[key];
    if (!normalizedAge) {
      errors.push(
        `Invalid age '${rawAge}'. Allowed age values: LESS_THAN_1_YEAR (< 1 year), ONE_TO_THREE_YEARS (1-3 years), THREE_TO_FIVE_YEARS (3-5 years), MORE_THAN_5_YEARS (> 5 years).`
      );
    }
  }

  // 4. Intention validation (checks 'intention' and alias 'userIntention')
  const rawIntention = input.intention || input.userIntention;
  let normalizedIntention: UserIntention | undefined;
  if (!rawIntention || typeof rawIntention !== 'string' || rawIntention.trim() === '') {
    errors.push("Field 'intention' is required.");
  } else {
    const key = rawIntention.trim().toUpperCase();
    normalizedIntention = INTENTION_MAP[key];
    if (!normalizedIntention) {
      errors.push(
        `Invalid intention '${rawIntention}'. Allowed intentions: KEEP_USE, REPAIR, SELL, GIVE_AWAY, DISPOSE_RESPONSIBLY.`
      );
    }
  }

  // 5. Urgency validation (optional, defaults to 'FLEXIBLE')
  let normalizedUrgency: ResolutionUrgency = 'FLEXIBLE';
  if (input.urgency && typeof input.urgency === 'string' && input.urgency.trim() !== '') {
    const key = input.urgency.trim().toUpperCase();
    const mapped = URGENCY_MAP[key];
    if (!mapped) {
      errors.push(
        `Invalid urgency '${input.urgency}'. Allowed urgency values: FLEXIBLE, URGENT.`
      );
    } else {
      normalizedUrgency = mapped;
    }
  }

  if (errors.length > 0 || !normalizedCategory || !normalizedCondition || !normalizedAge || !normalizedIntention) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    normalized: {
      category: normalizedCategory,
      condition: normalizedCondition,
      age: normalizedAge,
      intention: normalizedIntention,
      urgency: normalizedUrgency,
    },
  };
}
