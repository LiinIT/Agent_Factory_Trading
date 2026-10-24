import Link from 'next/link';
import { Suspense } from 'react';

import { AuthForm } from '@/features/auth/auth-form';

/**
 * Trang đăng ký.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function RegisterPage() {
  return (
    <main className="center">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
      <p className="muted">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
    </main>
  );
}
