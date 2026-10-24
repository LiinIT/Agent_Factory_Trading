import type { User } from '@/types';

import { apiRequest } from './api-client';

export type Credentials = { email: string; password: string; name?: string };

/**
 * Đăng nhập: server web cất token vào cookie httpOnly, trình duyệt chỉ nhận thông tin người dùng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function login(credentials: Credentials): Promise<{ user: User }> {
  return apiRequest('/api/session/login', { method: 'POST', body: JSON.stringify(credentials) });
}

/**
 * Đăng ký rồi đăng nhập luôn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function register(credentials: Credentials): Promise<{ user: User }> {
  return apiRequest('/api/session/register', { method: 'POST', body: JSON.stringify(credentials) });
}

/**
 * Đăng xuất (thu hồi refresh token, xoá cookie).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function logout(): Promise<void> {
  return apiRequest('/api/session/logout', { method: 'POST' });
}
