import { type NextRequest, NextResponse } from 'next/server';

import { ACCESS_COOKIE, REFRESH_COOKIE, roleFromAccessToken } from '@/lib/session';

const MEMBER_PATHS = ['/dashboard', '/profile'];
const ADMIN_PREFIX = '/admin';

/**
 * Chặn trang cần đăng nhập khi chưa có phiên (chuyển về /login) và trang admin khi không phải ADMIN.
 * Chỉ để điều hướng giao diện — quyền thật luôn do server kiểm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isMember = MEMBER_PATHS.some((path) => pathname.startsWith(path));
  if (!isAdmin && !isMember) return NextResponse.next();
  if (!request.cookies.get(REFRESH_COOKIE)) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  const role = roleFromAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (isAdmin && role !== null && role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/profile/:path*', '/admin/:path*'] };
