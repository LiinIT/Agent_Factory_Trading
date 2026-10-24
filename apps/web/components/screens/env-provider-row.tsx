'use client';

import { FlaskConical, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import type { EnvProvider, EnvSnapshot } from '@/lib/types';

type EnvProviderRowProps = {
  provider: EnvProvider;
  spentUsd: number;
  onApply: (action: () => Promise<EnvSnapshot>) => Promise<void>;
};

/**
 * Một nguồn hoả lực: trạng thái, khoá (ô mật khẩu, chỉ ghi), xoá khoá, bắn thử 1 lượt nhỏ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function EnvProviderRow({ provider, spentUsd, onApply }: EnvProviderRowProps) {
  const [value, setValue] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const save = async () => {
    if (!provider.secretName || !value.trim()) return;
    const name = provider.secretName;
    await onApply(() => api.setSecret(name, value.trim()));
    setValue('');
  };
  const remove = async () => {
    if (!provider.secretName || !window.confirm(`Xoá ${provider.secretName} khỏi Keychain?`)) return;
    const name = provider.secretName;
    await onApply(() => api.deleteSecret(name));
  };
  const test = async () => {
    setIsTesting(true);
    try {
      const result = await api.testProvider(provider.id);
      setTestResult(result.ok ? `ĐẠT · ${(result.durationMs / 1000).toFixed(1)}s · "${result.text}"` : `KHÔNG ĐẠT · ${result.text}`);
    } catch (error) {
      setTestResult(`KHÔNG ĐẠT · ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="env-provider">
      <div className="env-provider-head">
        <span className={`status-dot ${provider.status.ok ? 'is-working' : 'is-blocked'}`} />
        <strong>{provider.label}</strong>
        <span className="muted small">
          {provider.billing === 'goi' ? 'theo gói' : 'theo token'}
          {provider.billing === 'token' ? ` · hôm nay ≈$${spentUsd.toFixed(2)}` : ''}
        </span>
        <button className="button" onClick={() => void test()} disabled={isTesting} title="Bắn thử 1 lượt nhỏ">
          <FlaskConical size={13} aria-hidden /> {isTesting ? 'Đang thử…' : 'Kiểm tra'}
        </button>
      </div>
      <p className="muted small">{provider.note} · {provider.status.detail}</p>
      {provider.secretName ? (
        <div className="action-row">
          <code className="env-secret-name">{provider.secretName}</code>
          <span className="muted small">{provider.hint ?? 'chưa có'}</span>
          <input
            type="password"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={provider.hasSecret ? 'Nhập khoá mới để thay' : 'Dán khoá vào đây'}
            aria-label={`Giá trị ${provider.secretName}`}
          />
          <button className="button" onClick={() => void save()} disabled={!value.trim()}>
            <Save size={13} aria-hidden /> Lưu
          </button>
          {provider.hasSecret ? (
            <button className="button button-danger" onClick={() => void remove()}>
              <Trash2 size={13} aria-hidden /> Xoá
            </button>
          ) : null}
        </div>
      ) : null}
      {testResult ? <p className={testResult.startsWith('ĐẠT') ? 'small accent' : 'small error'}>{testResult}</p> : null}
    </div>
  );
}
