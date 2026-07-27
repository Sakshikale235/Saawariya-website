import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export type AuthFetchOptions = Omit<RequestInit, 'body'> & {
  json?: unknown;
  headers?: HeadersInit;
};


async function getAuthSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

export async function authFetch<T = any>(
  path: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const session = await getAuthSession();

  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  // Important: don’t double-prefix /api/ when API_BASE_URL is already the server root.
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const resp = await fetch(url, {
    ...options,
    headers,
    body: options.json !== undefined
  ? JSON.stringify(options.json)
  : undefined,
  } as any);


  const contentType = resp.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await resp.json().catch(() => null) : await resp.text().catch(() => null);

  if (!resp.ok) {
    // Keep error shape as close to backend/front expectations as possible.
    const msg = (body && (body.error || body.message)) || resp.statusText || 'Request failed';
    const err: any = new Error(msg);
    err.status = resp.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

