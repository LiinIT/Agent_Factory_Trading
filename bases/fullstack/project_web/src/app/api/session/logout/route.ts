import { cookies } from 'next/headers';

import { forwardWithRefresh } from '@/lib/backend';
import { clearSession, REFRESH_COOKIE } from '@/lib/session';

/**
 * `POST /api/session/logout` — thu hồi refresh token ở server rồi xoá cookie phiên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export async function POST(): Promise<Response> {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) await forwardWithRefresh({ method: 'POST', path: 'auth/logout', search: '', body: JSON.stringify({ refreshToken }) }, undefined);
  clearSession(jar);
  return new Response(null, { status: 204 });
}
