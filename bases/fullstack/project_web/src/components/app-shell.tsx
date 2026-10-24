import Link from 'next/link';
import type { ReactNode } from 'react';

import { LogoutButton } from '@/features/auth/logout-button';

export type NavLink = { href: string; label: string };

/**
 * Khung trang sau đăng nhập: thanh điều hướng + nút đăng xuất (dùng cho cả thành viên và admin).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function AppShell({ title, links, children }: { title: string; links: NavLink[]; children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <strong>{title}</strong>
        <nav className="row">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
        <LogoutButton />
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
