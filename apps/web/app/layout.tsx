import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin', 'vietnamese'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Dacvu_zero',
  description: 'Dacvu_zero — đơn vị dev ảo cá nhân chạy local',
  icons: {
    icon: { url: '/dv_zero_logo.png', type: 'image/png' },
    shortcut: '/dv_zero_logo.png',
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
