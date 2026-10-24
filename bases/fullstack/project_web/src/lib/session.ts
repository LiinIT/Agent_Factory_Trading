export const ACCESS_COOKIE = 'at';
export const REFRESH_COOKIE = 'rt';
const SECONDS_PER_DAY = 86_400;
const REFRESH_COOKIE_DAYS = 30;

export type SessionTokens = { accessToken: string; refreshToken: string; expiresIn: number };

type CookieJar = {
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  delete: (name: string) => void;
};

/**
 * Tuỳ chọn cookie phiên: httpOnly (JavaScript trong trình duyệt không đọc được), sameSite=lax,
 * secure khi chạy production (HTTPS).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge };
}

/**
 * Ghi cặp token vào cookie httpOnly — token không bao giờ nằm trong JavaScript của trình duyệt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function writeSession(cookies: CookieJar, tokens: SessionTokens): void {
  cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_COOKIE_DAYS * SECONDS_PER_DAY));
}

/**
 * Xoá cookie phiên (đăng xuất / refresh thất bại).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function clearSession(cookies: CookieJar): void {
  cookies.delete(ACCESS_COOKIE);
  cookies.delete(REFRESH_COOKIE);
}

/**
 * Đọc vai từ access token để điều hướng giao diện (KHÔNG dùng để phân quyền — server mới quyết định).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function roleFromAccessToken(token: string | undefined): string | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown };
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}
