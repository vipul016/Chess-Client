import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to test the actual api module, so we import it fresh.
// The api module uses import.meta.env which is handled by Vite/Vitest.

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('API — Axios instance configuration', () => {
  it('base URL defaults to http://localhost:8080', async () => {
    const { api } = await import('../api');
    expect(api.defaults.baseURL).toBe('http://localhost:8080');
  });

  it('request interceptor adds Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'test-token-123');
    const { api } = await import('../api');

    // Simulate the interceptor by creating a mock config
    // The interceptor is already attached, so we test via the interceptor manager
    const interceptors = (api.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[interceptors.length - 1];
    const config = { headers: {} as any };
    const result = requestInterceptor.fulfilled(config);

    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('request interceptor skips header when no token in localStorage', async () => {
    // localStorage is already cleared in beforeEach
    const { api } = await import('../api');

    const interceptors = (api.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[interceptors.length - 1];
    const config = { headers: {} as any };
    const result = requestInterceptor.fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
