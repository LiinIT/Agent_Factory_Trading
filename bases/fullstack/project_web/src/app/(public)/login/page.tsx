import Link from 'next/link';
import { Suspense } from 'react';

import { AuthForm } from '@/features/auth/auth-form';

/**
 * Trang đăng nhập.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function LoginPage() {
  return (
    <main className="center">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="muted">Chưa có tài khoản? <Link href="/register">Đăng ký</Link></p>
    </main>
  );
}
