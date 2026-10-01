import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  return 'http://10.108.214.168:5000/api';
};

export const API_BASE_URL = getBaseUrl();

export type ItemCondition = 'WORKING' | 'DAMAGED' | 'BROKEN';
export type ItemAction = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
export type ItemStatus =
  | 'POSTED'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | string;

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface ItemOwner {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  brand?: string | null;
  condition: ItemCondition | string;
  action: ItemAction | string;
  description?: string | null;
  location?: Record<string, unknown> | null;
  status: ItemStatus;
  images: string[];
  ownerId: string;
  categoryId: string;
  category?: Category;
  owner?: ItemOwner;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  brand?: string;
  condition: ItemCondition;
  action: ItemAction;
  description?: string;
  categoryId: string;
}

export interface ItemFilters {
  categoryId?: string | null;
  condition?: string | null;
  action?: string | null;
  search?: string | null;
  page?: number | null;
  limit?: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: unknown;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }

  if (!response.ok || !body.success) {
    throw new Error(body.message || `Request failed with status ${response.status}.`);
  }

  return body.data;
}

export const api = {
  items: {
    create: (payload: CreateItemPayload) =>
      request<Item>('/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getAll: (filters?: ItemFilters) => {
      const cleaned: Record<string, string> = {};
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value === undefined || value === null) {
            return;
          }
          const normalizedValue = String(value).trim();
          if (
            normalizedValue
            && normalizedValue !== 'undefined'
            && normalizedValue !== 'All'
            && normalizedValue !== 'ALL'
          ) {
            cleaned[key] = normalizedValue;
          }
        });
      }
      const query = new URLSearchParams(cleaned).toString();
      return request<Item[] | { items: Item[] }>(
        `/items${query ? `?${query}` : ''}`,
        { method: 'GET' },
      ).then((result) => {
        if (Array.isArray(result)) {
          return result;
        }
        if (Array.isArray(result.items)) {
          return result.items;
        }
        throw new Error('The server returned an invalid item list.');
      });
    },
    getById: (id: string) =>
      request<Item>(`/items/${encodeURIComponent(id)}`),
    update: (id: string, payload: Partial<CreateItemPayload>) =>
      request<Item>(`/items/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    getMyItems: () => request<Item[]>('/users/me/items'),
    uploadImages: async (id: string, files: { uri: string; name: string; type: string }[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append(
          'images',
          {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as unknown as Blob,
        );
      });
      return request<string[]>(`/items/${encodeURIComponent(id)}/images`, {
        method: 'POST',
        body: formData,
      });
    },
  },
  categories: {
    getAll: () => request<Category[]>('/categories'),
  },
};
