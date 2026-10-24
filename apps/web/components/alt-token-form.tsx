'use client';

import { KeyRound } from 'lucide-react';
import { useState } from 'react';

const TOKEN_PREFIX = 'sk-ant-';
const PARTIAL_TOKEN = 'Token phải bắt đầu bằng sk-ant-… — terminal ngắt token thành 2 dòng, hãy chép cả 2 dòng.';

type AltTokenFormProps = {
  isBusy: boolean;
  onSubmit: (token: string) => void;
};

/**
 * Ô nhập token tài khoản phụ: dạng mật khẩu, không tự điền, xoá ngay sau khi gửi; bỏ
 * khoảng trắng/xuống dòng dính theo khi chép token bị ngắt dòng trong terminal.
 * Token đi thẳng vào Keychain qua API, không bao giờ thành tin nhắn chat.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function AltTokenForm({ isBusy, onSubmit }: AltTokenFormProps) {
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  return (
    <form
      className="account-token"
      onSubmit={(event) => {
        event.preventDefault();
        const value = token.replace(/\s+/g, '');
        setToken('');
        if (!value) return;
        if (!value.startsWith(TOKEN_PREFIX)) {
          setFormError(PARTIAL_TOKEN);
          return;
        }
        setFormError(null);
        onSubmit(value);
      }}
    >
      <p className="muted">
        Tài khoản phụ chưa có token. Chạy <code>claude setup-token</code> bằng tài khoản phụ (trình duyệt đăng nhập tài khoản đó), dán dòng token vào đây.
      </p>
      <div className="account-token-row">
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Token tài khoản phụ"
          autoComplete="off"
          spellCheck={false}
          aria-label="Token tài khoản phụ"
        />
        <button className="button button-primary" type="submit" disabled={isBusy || !token.trim()}>
          <KeyRound size={13} aria-hidden /> Lưu &amp; chuyển
        </button>
      </div>
      {formError ? <p className="error">{formError}</p> : null}
    </form>
  );
}
