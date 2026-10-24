import { cookies } from 'next/headers';

import { forwardWithRefresh } from '@/lib/backend';
import { ACCESS_COOKIE, clearSession, REFRESH_COOKIE, writeSession } from '@/lib/session';

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Proxy `/api/server/*` → server `/api/v1/*`: gắn access token từ cookie httpOnly, tự làm mới khi hết hạn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const jar = await cookies();
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const result = await forwardWithRefresh(
    {
      method: request.method,
      path: path.map(encodeURIComponent).join('/'),
      search: new URL(request.url).search,
      body: hasBody ? await request.text() : undefined,
      accessToken: jar.get(ACCESS_COOKIE)?.value,
    },
    jar.get(REFRESH_COOKIE)?.value,
  );
  if (result.refreshed) writeSession(jar, result.refreshed);
  if (result.signedOut) clearSession(jar);
  return new Response(result.status === 204 ? null : result.body, { status: result.status, headers: { 'content-type': result.contentType } });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
