import { apiRequest } from './api';
import { CommunityImpact, EcoSummary } from '../types';

export const ecoService = {
  getMine: () => apiRequest<EcoSummary>('GET', '/eco/me'),

  getCommunity: () => apiRequest<CommunityImpact>('GET', '/eco/community'),
};
