import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';

const ADMIN_LINKS = [
  { href: '/admin/dashboard', label: 'Tổng quan' },
  { href: '/admin/members', label: 'Người dùng' },
];

/**
 * Khung các trang quản trị (chỉ ADMIN; server kiểm quyền mọi API).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell title="Quản trị" links={ADMIN_LINKS}>{children}</AppShell>;
}
