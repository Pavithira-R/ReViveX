// ============================================================================
// Member 3 - Search Query Validator
// Validates and normalizes unified search and filter query parameters
// ============================================================================

import {
  SearchQueryParams,
  ValidatedSearchQuery,
  SearchActionType,
  SearchEntityType,
  SearchCondition,
} from '../types/search.types';

export interface SearchValidationResult {
  isValid: boolean;
  errors: string[];
  validatedQuery?: ValidatedSearchQuery;
}

const ALLOWED_ACTION_TYPES: Record<string, SearchActionType> = {
  ALL: 'ALL',
  REPAIR: 'REPAIR',
  SELL: 'SELL',
  DONATE: 'DONATE',
  REUSE: 'REUSE',
  RECYCLE: 'RECYCLE',
};

const ALLOWED_ENTITY_TYPES: Record<string, SearchEntityType> = {
  ALL: 'ALL',
  ITEMS: 'ITEMS',
  PROVIDERS: 'PROVIDERS',
  LISTINGS: 'LISTINGS',
  RECYCLING: 'RECYCLING',
};

const ALLOWED_CONDITIONS: Record<string, SearchCondition> = {
  WORKING: 'WORKING',
  DAMAGED: 'DAMAGED',
  BROKEN: 'BROKEN',
  WORKING_NORMALLY: 'WORKING_NORMALLY',
  'WORKING NORMALLY': 'WORKING_NORMALLY',
  WORKING_WITH_PROBLEMS: 'WORKING_WITH_PROBLEMS',
  'WORKING WITH PROBLEMS': 'WORKING_WITH_PROBLEMS',
  NOT_WORKING: 'NOT_WORKING',
  'NOT WORKING': 'NOT_WORKING',
  PHYSICALLY_DAMAGED: 'PHYSICALLY_DAMAGED',
  'PHYSICALLY DAMAGED': 'PHYSICALLY_DAMAGED',
};

export function validateSearchQuery(query: SearchQueryParams): SearchValidationResult {
  const errors: string[] = [];

  // 1. Keyword search (q or search)
  const rawQ = query.q !== undefined ? query.q : query.search;
  let q: string | undefined;
  if (rawQ !== undefined) {
    if (typeof rawQ !== 'string') {
      errors.push("Parameter 'q' (or 'search') must be a string.");
    } else if (rawQ.trim().length > 100) {
      errors.push("Search query cannot exceed 100 characters.");
    } else if (rawQ.trim().length > 0) {
      q = rawQ.trim();
    }
  }

  // 2. Category
  let category: string | undefined;
  if (query.category !== undefined) {
    if (typeof query.category !== 'string') {
      errors.push("Parameter 'category' must be a string.");
    } else if (query.category.trim().length > 50) {
      errors.push("Category filter cannot exceed 50 characters.");
    } else if (query.category.trim().length > 0) {
      category = query.category.trim();
    }
  }

  // 3. Action Type
  let actionType: SearchActionType = 'ALL';
  if (query.actionType !== undefined && query.actionType !== '') {
    if (typeof query.actionType !== 'string') {
      errors.push("Parameter 'actionType' must be a string.");
    } else {
      const upper = query.actionType.trim().toUpperCase();
      const mapped = ALLOWED_ACTION_TYPES[upper];
      if (!mapped) {
        errors.push(
          `Invalid actionType '${query.actionType}'. Allowed values: ALL, REPAIR, SELL, DONATE, REUSE, RECYCLE.`
        );
      } else {
        actionType = mapped;
      }
    }
  }

  // 4. Entity Type
  let entityType: SearchEntityType = 'ALL';
  if (query.entityType !== undefined && query.entityType !== '') {
    if (typeof query.entityType !== 'string') {
      errors.push("Parameter 'entityType' must be a string.");
    } else {
      const upper = query.entityType.trim().toUpperCase();
      const mapped = ALLOWED_ENTITY_TYPES[upper];
      if (!mapped) {
        errors.push(
          `Invalid entityType '${query.entityType}'. Allowed values: ALL, ITEMS, PROVIDERS, LISTINGS, RECYCLING.`
        );
      } else {
        entityType = mapped;
      }
    }
  }

  // 5. Condition
  let condition: SearchCondition | undefined;
  if (query.condition !== undefined && query.condition !== '') {
    if (typeof query.condition !== 'string') {
      errors.push("Parameter 'condition' must be a string.");
    } else {
      const upper = query.condition.trim().toUpperCase();
      const mapped = ALLOWED_CONDITIONS[upper];
      if (!mapped) {
        errors.push(
          `Invalid condition '${query.condition}'. Allowed values: WORKING, DAMAGED, BROKEN, WORKING_NORMALLY, WORKING_WITH_PROBLEMS, NOT_WORKING, PHYSICALLY_DAMAGED.`
        );
      } else {
        condition = mapped;
      }
    }
  }

  // 6. Provider Rating (minRating: 1.0 - 5.0)
  let minRating: number | undefined;
  if (query.minRating !== undefined && query.minRating !== '') {
    const num = Number(query.minRating);
    if (isNaN(num) || num < 1.0 || num > 5.0) {
      errors.push("Parameter 'minRating' must be a number between 1.0 and 5.0.");
    } else {
      minRating = num;
    }
  }

  // 7. Max Distance (maxDistanceKm: > 0)
  let maxDistanceKm: number | undefined;
  if (query.maxDistanceKm !== undefined && query.maxDistanceKm !== '') {
    const num = Number(query.maxDistanceKm);
    if (isNaN(num) || num <= 0) {
      errors.push("Parameter 'maxDistanceKm' must be a positive number greater than 0.");
    } else {
      maxDistanceKm = num;
    }
  }

  // 8. Price Range (minPrice, maxPrice >= 0, maxPrice >= minPrice)
  let minPrice: number | undefined;
  if (query.minPrice !== undefined && query.minPrice !== '') {
    const num = Number(query.minPrice);
    if (isNaN(num) || num < 0) {
      errors.push("Parameter 'minPrice' must be a non-negative number.");
    } else {
      minPrice = num;
    }
  }

  let maxPrice: number | undefined;
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const num = Number(query.maxPrice);
    if (isNaN(num) || num < 0) {
      errors.push("Parameter 'maxPrice' must be a non-negative number.");
    } else {
      maxPrice = num;
    }
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.push("Parameter 'maxPrice' must be greater than or equal to 'minPrice'.");
  }

  // 9. Pagination (page >= 1, limit: 1-100)
  let page = 1;
  if (query.page !== undefined && query.page !== '') {
    const num = Number(query.page);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      errors.push("Parameter 'page' must be an integer greater than or equal to 1.");
    } else {
      page = num;
    }
  }

  let limit = 20;
  if (query.limit !== undefined && query.limit !== '') {
    const num = Number(query.limit);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 100) {
      errors.push("Parameter 'limit' must be an integer between 1 and 100.");
    } else {
      limit = num;
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
      q,
      category,
      actionType,
      condition,
      entityType,
      minRating,
      maxDistanceKm,
      minPrice,
      maxPrice,
      page,
      limit,
    },
  };
}
