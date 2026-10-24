import { cookies } from 'next/headers';

import { forwardWithRefresh } from '@/lib/backend';
import { type SessionTokens, writeSession } from '@/lib/session';

/**
 * Gọi API đăng nhập / đăng ký của server; thành công thì cất token vào cookie httpOnly và
 * chỉ trả thông tin người dùng cho trình duyệt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export async function startSession(request: Request, backendPath: 'auth/login' | 'auth/register'): Promise<Response> {
  const result = await forwardWithRefresh({ method: 'POST', path: backendPath, search: '', body: await request.text() }, undefined);
  if (result.status >= 300) return new Response(result.body, { status: result.status, headers: { 'content-type': result.contentType } });
  const tokens = JSON.parse(result.body) as SessionTokens & { user: unknown };
  writeSession(await cookies(), tokens);
  return Response.json({ user: tokens.user });
}
