import type { User, UserPage } from '@/types';

import { apiRequest } from './api-client';

/**
 * Hồ sơ của người đang đăng nhập (`GET /api/v1/users/me`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function fetchMe(): Promise<User> {
  return apiRequest('/api/server/users/me');
}

/**
 * Một trang danh sách người dùng cho admin (`GET /api/v1/admin/users`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function fetchUsers(page: number, pageSize: number): Promise<UserPage> {
  return apiRequest(`/api/server/admin/users?page=${page}&pageSize=${pageSize}`);
}
