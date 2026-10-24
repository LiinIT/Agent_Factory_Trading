'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { EnvProvider, EnvSnapshot } from '@/lib/types';

const MANAGER_ROLE = 'tham-muu-truong';
const DEFAULT_PROVIDER = 'claude-main';

type EnvAssignRowProps = {
  role: { name: string; unit: string; model: string };
  providers: EnvProvider[];
  assignment: { provider: string; model?: string } | undefined;
  onApply: (action: () => Promise<EnvSnapshot>) => Promise<void>;
};

/**
 * Gán nguồn + model cho một ban. Tham mưu trưởng chỉ chọn được nguồn Claude.
 * Model để trống = theo chế độ (Chuẩn/Tà môn) với Claude, mặc định của Codex với ChatGPT.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function EnvAssignRow({ role, providers, assignment, onApply }: EnvAssignRowProps) {
  const [providerId, setProviderId] = useState(assignment?.provider ?? DEFAULT_PROVIDER);
  const [model, setModel] = useState(assignment?.model ?? '');
  useEffect(() => {
    setProviderId(assignment?.provider ?? DEFAULT_PROVIDER);
    setModel(assignment?.model ?? '');
  }, [assignment]);

  const options = providers.filter((provider) => role.name !== MANAGER_ROLE || provider.engine === 'claude');
  const selected = providers.find((provider) => provider.id === providerId);
  const isDirty = providerId !== (assignment?.provider ?? DEFAULT_PROVIDER) || model !== (assignment?.model ?? '');
  return (
    <div className="env-assign-row">
      <span className="env-unit">{role.unit}</span>
      <select value={providerId} onChange={(event) => setProviderId(event.target.value)} aria-label={`Nguồn của ${role.unit}`}>
        {options.map((provider) => (
          <option key={provider.id} value={provider.id}>{provider.label}</option>
        ))}
      </select>
      <input
        list={`models-${role.name}`}
        value={model}
        onChange={(event) => setModel(event.target.value)}
        placeholder={selected?.engine === 'codex' ? 'mặc định Codex' : `theo chế độ (${role.model})`}
        aria-label={`Model của ${role.unit}`}
      />
      <datalist id={`models-${role.name}`}>
        {(selected?.models ?? []).map((item) => <option key={item} value={item} />)}
      </datalist>
      <button className="button" disabled={!isDirty} onClick={() => void onApply(() => api.assignProvider(role.name, providerId, model))}>
        Lưu
      </button>
    </div>
  );
}
