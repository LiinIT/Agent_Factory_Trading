import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin', 'vietnamese'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'DV2 Agent Trading',
  description: 'DV2 (Điệp viên Two) — đội agent tạo và kiểm chứng bot EA, chạy local',
  icons: {
    icon: { url: '/dv2_logo.svg', type: 'image/svg+xml' },
    shortcut: '/dv2_logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#05070c',
  colorScheme: 'dark',
};

/**
 * Khung HTML chung: chỉ giao diện tối, font mono tự host (next/font tải lúc build); bỏ qua
 * thuộc tính extension trình duyệt chèn vào thẻ body (chỉ thẻ body, không lan xuống con).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={mono.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
