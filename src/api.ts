import { supabase } from '@/lib/supabase';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

function buildQuery(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (!entries.length) return '';
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)]))}`;
}

async function authHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
}

async function request(path: string, init: RequestInit, parseJson = true) {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (response.ok) {
    return parseJson ? response.json() : response;
  }

  const text = await response.text();
  throw new Error(text || `Request failed with status ${response.status}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  return request(path, { headers }) as Promise<T>;
}

export async function apiGetWithQuery<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  return apiGet<T>(`${path}${buildQuery(params)}`);
}

export async function apiJson<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const headers = await authHeaders();
  return request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    } as Record<string, string>,
    body: body ? JSON.stringify(body) : undefined,
  }) as Promise<T>;
}
