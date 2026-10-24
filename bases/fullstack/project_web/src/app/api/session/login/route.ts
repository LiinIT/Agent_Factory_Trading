import { startSession } from '../session-route';

/**
 * `POST /api/session/login` — đăng nhập, token vào cookie httpOnly.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function POST(request: Request): Promise<Response> {
  return startSession(request, 'auth/login');
}
