'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import type { Task } from '@/lib/types';

type PermissionGrantProps = {
  task: Task;
  onChanged: () => void;
};

/**
 * Cấp quyền cho task bị chặn: bấm quyền gợi ý hoặc tự nhập (vd `Bash(./dv2 compile *)`).
 * Quyền chỉ áp dụng cho riêng task này; server từ chối quyền nguy hiểm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function PermissionGrant({ task, onChanged }: PermissionGrantProps) {
  const [custom, setCustom] = useState('');
  const [grantError, setGrantError] = useState<string | null>(null);

  const grant = async (tool: string) => {
    if (!window.confirm(`Cấp quyền "${tool}" cho task #${task.id} và chạy lại?`)) return;
    try {
      await api.grant(task.id, tool);
      setGrantError(null);
      setCustom('');
      onChanged();
    } catch (error) {
      setGrantError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="grant">
      <p className="muted">Agent bị chặn các quyền sau ở lần chạy gần nhất:</p>
      <div className="action-row">
        {task.deniedTools.map((tool) => (
          <button key={tool} className="button" onClick={() => void grant(tool)}>Cấp {tool}</button>
        ))}
      </div>
      <form className="action-row" onSubmit={(event) => { event.preventDefault(); void grant(custom.trim()); }}>
        <input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Quyền khác, vd Bash(./dv2 compile *)" aria-label="Quyền tự nhập" />
        <button className="button" type="submit" disabled={!custom.trim()}>Cấp</button>
      </form>
      {task.extraTools.length > 0 ? <p className="muted">Đã cấp: {task.extraTools.join(', ')}</p> : null}
      {grantError ? <p className="error">{grantError}</p> : null}
    </div>
  );
}
