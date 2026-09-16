import { useBuyerStore } from '@/store/buyer-store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit & { tenantIdOrSlug?: string } = {}
): Promise<ApiResponse<T>> {
  const { tenantIdOrSlug, headers = {}, ...rest } = options;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (tenantIdOrSlug) {
    defaultHeaders['x-tenant-id'] = tenantIdOrSlug;
  }

  const buyerToken = useBuyerStore.getState().token;
  if (buyerToken && !defaultHeaders.Authorization) {
    defaultHeaders.Authorization = `Bearer ${buyerToken}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...rest,
      headers: defaultHeaders,
    });

    const body = await res.text();
    const data = body ? JSON.parse(body) : {};

    if (!res.ok) {
      throw new Error(data?.message || data?.error || `Request gagal (${res.status})`);
    }

    return data;
  } catch (err: any) {
    throw new Error(err?.message || 'Gagal tersambung ke backend ALURELAB.');
  }
}
