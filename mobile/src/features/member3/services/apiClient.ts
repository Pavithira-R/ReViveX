// ============================================================================
// Member 3 - API Client Service
// Platform-aware HTTP client with timeout, error handling and offline safety
// ============================================================================

import { Platform } from 'react-native';
import { API_BASE_URL } from '../../../constants';

let activeBaseUrl = API_BASE_URL;

export function setApiBaseUrl(url: string) {
  activeBaseUrl = url.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    details: string[];
  } | null;
}

export async function requestApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, timeoutMs = 6000 } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${activeBaseUrl}${cleanEndpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    };

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timer);

    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !json.success) {
      const errorMessage =
        json.error?.details?.join(', ') ||
        json.message ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMessage) as any;
      err.status = response.status;
      err.data = json;
      throw err;
    }

    return json.data;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  }
}
