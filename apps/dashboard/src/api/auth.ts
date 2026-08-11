import type { LoginPayload, LoginResponse, AuthCheckResponse } from '@oklychee/prism-shared';
import { API_BASE, customFetch, setCookie, deleteCookie, AUTH_TOKEN_KEY } from './client';

export const authApi = {
  // Admin Login
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data: LoginResponse = await res.json();
    setCookie(AUTH_TOKEN_KEY, data.token, 7); // Save token to cookies for 7 days
    if (data.must_change_password) {
      sessionStorage.setItem('prism_must_change_password', 'true');
    } else {
      sessionStorage.removeItem('prism_must_change_password');
    }
    return data;
  },

  // Check Token Validity
  async check(): Promise<AuthCheckResponse> {
    try {
      const res = await customFetch(`${API_BASE}/auth/check`);
      if (!res.ok) return { authenticated: false };
      const data: AuthCheckResponse = await res.json();
      return data;
    } catch {
      return { authenticated: false };
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await customFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    } finally {
      deleteCookie(AUTH_TOKEN_KEY);
      sessionStorage.removeItem('prism_must_change_password');
    }
  },
};
