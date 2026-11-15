// ============================================================================
// Phase 1 - Service Provider Profile Types
// ============================================================================

import { ServiceProvider } from '../../../types';

export type { ServiceProvider };

export interface ProviderProfileState {
  provider: ServiceProvider | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProviderListState {
  providers: ServiceProvider[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}
