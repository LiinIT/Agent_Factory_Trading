import type { SessionTokens } from './session';

export const API_PREFIX = '/api/v1';

export type serverCall = { method: string; path: string; search: string; body?: string; accessToken?: string };
export type serverResult = { status: number; body: string; contentType: string; refreshed: SessionTokens | null; signedOut: boolean };
type FetchImpl = typeof fetch;

/**
 * Địa chỉ server (chỉ server Next.js dùng; trình duyệt không gọi thẳng server).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function backendUrl(): string {
  return (process.env.SERVER_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
}

/**
 * Gọi một API của server kèm access token.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
async function send(call: serverCall, fetchImpl: FetchImpl): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (call.accessToken) headers.authorization = `Bearer ${call.accessToken}`;
  return fetchImpl(`${backendUrl()}${API_PREFIX}/${call.path}${call.search}`, { method: call.method, headers, body: call.body, cache: 'no-store' });
}

/**
 * Đổi refresh token lấy cặp token mới; thất bại thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export async function refreshTokens(refreshToken: string, fetchImpl: FetchImpl = fetch): Promise<SessionTokens | null> {
  const response = await send({ method: 'POST', path: 'auth/refresh', search: '', body: JSON.stringify({ refreshToken }) }, fetchImpl);
  return response.ok ? ((await response.json()) as SessionTokens) : null;
}

/**
 * Chuyển request sang server; access token hết hạn (401) mà còn refresh token thì làm mới một lần
 * rồi gọi lại. Làm mới thất bại thì báo đăng xuất.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export async function forwardWithRefresh(call: serverCall, refreshToken: string | undefined, fetchImpl: FetchImpl = fetch): Promise<serverResult> {
  let response = await send(call, fetchImpl);
  let refreshed: SessionTokens | null = null;
  let signedOut = false;
  if (response.status === 401 && refreshToken) {
    refreshed = await refreshTokens(refreshToken, fetchImpl);
    if (refreshed) response = await send({ ...call, accessToken: refreshed.accessToken }, fetchImpl);
    else signedOut = true;
  }
  return { status: response.status, body: await response.text(), contentType: response.headers.get('content-type') ?? 'application/json', refreshed, signedOut };
}
