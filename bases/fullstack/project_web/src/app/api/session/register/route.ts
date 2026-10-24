import { startSession } from '../session-route';

/**
 * `POST /api/session/register` — đăng ký, đăng nhập luôn, token vào cookie httpOnly.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function POST(request: Request): Promise<Response> {
  return startSession(request, 'auth/register');
}
