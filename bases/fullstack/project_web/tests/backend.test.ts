import { describe, expect, it } from 'vitest';

import { forwardWithRefresh } from '@/lib/backend';
import { roleFromAccessToken } from '@/lib/session';

type Seen = { url: string; authorization?: string };

/**
 * Backend giả: access token "old" hết hạn (401), refresh token "rt-ok" đổi được token "new".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function fakeBackend(seen: Seen[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const authorization = (init?.headers as Record<string, string> | undefined)?.authorization;
    seen.push({ url, authorization });
    if (url.endsWith('/auth/refresh')) {
      const { refreshToken } = JSON.parse(String(init?.body)) as { refreshToken: string };
      return refreshToken === 'rt-ok' ? Response.json({ accessToken: 'new', refreshToken: 'rt-2', expiresIn: 900 }) : new Response('{}', { status: 401 });
    }
    return authorization === 'Bearer new' ? Response.json({ ok: true }) : new Response('{}', { status: 401 });
  }) as typeof fetch;
}

describe('forwardWithRefresh', () => {
  it('access token hết hạn: làm mới một lần rồi gọi lại, trả token mới để ghi cookie', async () => {
    const seen: Seen[] = [];
    const result = await forwardWithRefresh({ method: 'GET', path: 'users/me', search: '', accessToken: 'old' }, 'rt-ok', fakeBackend(seen));
    expect(result.status).toBe(200);
    expect(result.refreshed?.accessToken).toBe('new');
    expect(seen.map((call) => call.url.replace(/^.*\/api\/v1/, ''))).toEqual(['/users/me', '/auth/refresh', '/users/me']);
  });

  it('refresh token hỏng: báo đăng xuất, không gọi lại', async () => {
    const seen: Seen[] = [];
    const result = await forwardWithRefresh({ method: 'GET', path: 'users/me', search: '', accessToken: 'old' }, 'rt-bad', fakeBackend(seen));
    expect(result).toMatchObject({ status: 401, signedOut: true, refreshed: null });
    expect(seen).toHaveLength(2);
  });
});

describe('roleFromAccessToken', () => {
  it('đọc vai từ JWT để điều hướng, token hỏng thì null', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'u1', role: 'ADMIN' })).toString('base64url');
    expect(roleFromAccessToken(`h.${payload}.s`)).toBe('ADMIN');
    expect(roleFromAccessToken('khong-phai-jwt')).toBeNull();
    expect(roleFromAccessToken(undefined)).toBeNull();
  });
});
