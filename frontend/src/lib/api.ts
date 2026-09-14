/**
 * ALURELAB API Client
 * Axios instance terkonfigurasi untuk backend Laravel + Sanctum token.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

// ── Request Interceptor — inject Sanctum token ────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Inject store slug sebagai header (tenant identification)
  if (typeof window !== 'undefined') {
    const storeSlug = localStorage.getItem('alurelab_store_slug');
    if (storeSlug) {
      config.headers['X-Store-Slug'] = storeSlug;
    }
  }

  // Inject Sanctum bearer token dari NextAuth session
  try {
    const session = await getSession();
    if (session?.backendToken) {
      config.headers.Authorization = `Bearer ${session.backendToken}`;
    }
  } catch {
    // getSession() bisa fail di server component — skip
  }

  return config;
});

// ── Response Interceptor — handle 401 auto-logout ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid → signout
      await signOut({ callbackUrl: '/login' });
    }
    return Promise.reject(error);
  }
);

// ── API helper function untuk Server Components (pakai token langsung) ────────
export function createServerApi(token: string, storeSlug?: string) {
  return axios.create({
    baseURL: process.env.API_URL ?? 'http://localhost:8000/api/v1',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(storeSlug ? { 'X-Store-Slug': storeSlug } : {}),
    },
    timeout: 10_000,
  });
}

export default api;
