'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { EnvSnapshot } from '@/lib/types';

import { EnvAssignRow } from './env-assign-row';
import { EnvProviderRow } from './env-provider-row';

/**
 * Màn Env (phím `): nguồn hoả lực và API key (chỉ ghi vào, hiện 4 ký tự cuối), gán nguồn
 * + model cho từng ban, nguồn dự phòng khi hết quota, trần chi tiêu ngày, trạng thái Ollama.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function EnvScreen() {
  const [snapshot, setSnapshot] = useState<EnvSnapshot | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);
  const [cap, setCap] = useState('');

  const apply = useCallback(async (action: () => Promise<EnvSnapshot>) => {
    try {
      const next = await action();
      setSnapshot(next);
      setCap(String(next.capUsd));
      setEnvError(null);
    } catch (error) {
      setEnvError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    void apply(api.env);
  }, [apply]);

  if (!snapshot) return <p className="muted">{envError ?? '$ đang đọc env…'}</p>;
  const paidSpend = Object.entries(snapshot.spendToday).filter(([, usd]) => usd > 0);
  return (
    <div className="env">
      <div className="env-head">
        <h3>Nguồn hoả lực</h3>
        <button className="icon-button is-small" onClick={() => void apply(api.env)} aria-label="Tải lại" title="Tải lại">
          <RefreshCw size={13} />
        </button>
      </div>
      <p className="muted small">Khoá lưu trong Keychain macOS, chỉ orchestrator đọc; web chỉ thấy 4 ký tự cuối. ChatGPT Plus không cấp API key — dùng qua Codex đã đăng nhập.</p>
      <div className="env-list">
        {snapshot.providers.map((provider) => (
          <EnvProviderRow key={provider.id} provider={provider} spentUsd={snapshot.spendToday[provider.id] ?? 0} onApply={apply} />
        ))}
        <div className="env-provider">
          <div className="env-provider-head">
            <span className={`status-dot ${snapshot.ollama.status.ok ? 'is-working' : 'is-blocked'}`} />
            <strong>Ollama · máy</strong>
            <span className="muted small">miễn phí · báo cáo tình hình ({snapshot.ollama.model})</span>
          </div>
          <p className="muted small">{snapshot.ollama.status.detail}</p>
        </div>
      </div>

      <h3>Gán nguồn cho từng ban</h3>
      <div className="env-assign">
        {snapshot.roles.map((role) => (
          <EnvAssignRow key={role.name} role={role} providers={snapshot.providers} assignment={snapshot.assignments[role.name]} onApply={apply} />
        ))}
      </div>

      <h3>Dự phòng & trần chi tiêu</h3>
      <div className="env-row">
        <label className="env-field">
          <span className="muted small">Khi hết quota chuyển sang</span>
          <select value={snapshot.fallback ?? ''} onChange={(event) => void apply(() => api.setFallback(event.target.value || null))}>
            <option value="">— không dự phòng —</option>
            {snapshot.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.label}</option>
            ))}
          </select>
        </label>
        <label className="env-field">
          <span className="muted small">Trần chi tiêu / ngày (nguồn theo token), USD</span>
          <span className="action-row">
            <input type="number" min={0} step={1} value={cap} onChange={(event) => setCap(event.target.value)} aria-label="Trần chi tiêu USD" />
            <button className="button" onClick={() => void apply(() => api.setSpendCap(Number(cap)))}>Lưu</button>
          </span>
        </label>
      </div>
      <p className="muted small">
        Chi tiêu hôm nay: {paidSpend.length === 0 ? '$0' : paidSpend.map(([id, usd]) => `${id} ≈$${usd.toFixed(2)}`).join(' · ')} (OpenAI qua Codex là ước tính theo token).
      </p>
      {envError ? <p className="error">{envError}</p> : null}
    </div>
  );
}
