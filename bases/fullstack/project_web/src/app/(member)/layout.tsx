import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';

const MEMBER_LINKS = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/profile', label: 'Hồ sơ' },
];

/**
 * Khung các trang thành viên (đã đăng nhập).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  return <AppShell title="Thành viên" links={MEMBER_LINKS}>{children}</AppShell>;
}
