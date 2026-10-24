'use client';

import { useRouter } from 'next/navigation';

import { logout } from '@/services/auth-service';

/**
 * Nút đăng xuất: thu hồi phiên rồi về trang đăng nhập.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button className="button" onClick={() => void logout().finally(() => router.replace('/login'))}>
      Đăng xuất
    </button>
  );
}
