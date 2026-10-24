'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { AccountStatus } from '@/lib/types';

import { AccountRow } from './account-row';
import { AltTokenForm } from './alt-token-form';

const MAIN_ACCOUNT = 'claude-main';
const ALT_ACCOUNT = 'claude-alt';

/**
 * Thẻ đổi tài khoản Claude hiện trong chat khi Tham mưu trưởng hết hạn mức: tình hình từng
 * tài khoản, nạp token tài khoản phụ, nút chuyển; chuyển xong tin bị lỗi được gửi lại tự động.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function AccountSwitchCard() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    api.accounts().then(setStatus).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : String(caught)));
  }, []);

  const run = async (action: () => Promise<AccountStatus>) => {
    setIsBusy(true);
    setError(null);
    try {
      setStatus(await action());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsBusy(false);
    }
  };

  if (!status) return <div className="account-card">{error ? <p className="error">{error}</p> : <p className="muted">Đang đọc tình hình tài khoản…</p>}</div>;
  const alt = status.accounts.find((account) => account.id === ALT_ACCOUNT);
  const preferred = status.accounts.find((account) => account.isPreferred)?.id ?? MAIN_ACCOUNT;
  const target = preferred === ALT_ACCOUNT ? MAIN_ACCOUNT : ALT_ACCOUNT;
  const targetLabel = status.accounts.find((account) => account.id === target)?.label ?? target;

  return (
    <div className="account-card">
      <span className="bubble-sender inline-icon">
        <ArrowLeftRight size={12} aria-hidden /> Đổi tài khoản Claude
      </span>
      <ul className="account-list">
        {status.accounts.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </ul>
      <p className="muted">{status.next ? `Lượt kế tiếp chạy bằng: ${status.next}.` : 'Không còn tài khoản nào chạy được.'}</p>
      {alt && !alt.hasLogin ? (
        <AltTokenForm isBusy={isBusy} onSubmit={(token) => void run(() => api.saveAltToken(token))} />
      ) : (
        <button className="button button-primary" disabled={isBusy} onClick={() => void run(() => api.useAccount(target))}>
          Chuyển sang {targetLabel}
        </button>
      )}
      {status.pendingRetry ? <p className="muted">Lệnh bị lỗi sẽ tự gửi lại cho Tham mưu trưởng sau khi chuyển.</p> : null}
      {isBusy ? <p className="muted">Đang lưu và bắn thử…</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
