'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { ApiError } from '@/services/api-client';
import { type Credentials, login, register } from '@/services/auth-service';

const PASSWORD_MIN = 8;
const SUBMIT_LABELS = { login: 'Đăng nhập', register: 'Tạo tài khoản' } as const;

/**
 * Form đăng nhập / đăng ký dùng chung: kiểm dữ liệu cơ bản, hiện lỗi của server, xong thì chuyển trang.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials: Credentials = { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') };
    if (mode === 'register') credentials.name = String(form.get('name') ?? '') || undefined;
    setIsSubmitting(true);
    setError(null);
    try {
      const { user } = await (mode === 'login' ? login(credentials) : register(credentials));
      router.replace(next ?? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'));
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : String(caught));
      setIsSubmitting(false);
    }
  };

  return (
    <form className="card form" onSubmit={(event) => void submit(event)}>
      <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
      {mode === 'register' ? (
        <label>Tên<input name="name" autoComplete="name" /></label>
      ) : null}
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Mật khẩu<input name="password" type="password" required minLength={PASSWORD_MIN} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button className="button primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi…' : SUBMIT_LABELS[mode]}
      </button>
    </form>
  );
}
