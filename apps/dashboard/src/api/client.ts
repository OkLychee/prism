export const API_BASE = '/api';

/**
 * Cookie Helper utilities for auth token management
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const AUTH_TOKEN_KEY = 'prism_auth_token';

let onUnauthorizedCallback: (() => void) | null = null;
let onErrorCallback: ((message: string) => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorizedCallback = handler;
}

export function registerErrorHandler(handler: (message: string) => void) {
  onErrorCallback = handler;
}

export function notifyError(message: string) {
  if (onErrorCallback) {
    onErrorCallback(message);
  }
}

/**
 * Custom fetch wrapper that injects Authorization Bearer token from cookies,
 * handles 401 Unauthorized globally, and extracts backend error messages.
 */
export async function customFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getCookie(AUTH_TOKEN_KEY);
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers,
    });
  } catch (err: any) {
    const errorMsg = err?.message || '网络连接异常，请重试';
    notifyError(errorMsg);
    throw err;
  }

  if (response.status === 401) {
    deleteCookie(AUTH_TOKEN_KEY);
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  if (!response.ok) {
    const responseClone = response.clone();
    try {
      const errorData = await responseClone.json();
      const serverError = errorData.error || errorData.message;
      if (serverError && typeof serverError === 'string') {
        notifyError(serverError);
      }
    } catch {
      // Non-JSON error response
    }
  }

  return response;
}
