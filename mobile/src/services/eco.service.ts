import { apiRequest } from './api';
import { EcoSummary } from '../types';

export const ecoService = {
  getMine: () => apiRequest<EcoSummary>('GET', '/eco/me'),
};
