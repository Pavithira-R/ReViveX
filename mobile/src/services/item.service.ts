// Member 2 – Item Management
import { apiRequest, apiUpload } from './api';
import { Category, CreateItemPayload, Item, ItemFilters } from '../types';

const queryString = (filters: ItemFilters = {}): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const itemService = {
  categories: () => apiRequest<Category[]>('GET', '/categories'),
  list: (filters: ItemFilters = {}) =>
    apiRequest<Item[]>('GET', `/items${queryString(filters)}`),
  get: (id: string) => apiRequest<Item>('GET', `/items/${encodeURIComponent(id)}`),
  create: (payload: CreateItemPayload) => apiRequest<Item>('POST', '/items', payload),
  update: (id: string, payload: Partial<CreateItemPayload> & { status?: Item['status'] }) =>
    apiRequest<Item>('PUT', `/items/${encodeURIComponent(id)}`, payload),
  remove: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>('DELETE', `/items/${encodeURIComponent(id)}`),
  mine: () => apiRequest<Item[]>('GET', '/users/me/items'),
  uploadImages: (id: string, form: FormData) =>
    apiUpload<string[]>(`/items/${encodeURIComponent(id)}/images`, form),
};