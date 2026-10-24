'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import type { Project } from '@/lib/types';

/**
 * Xoá project: gõ đúng tên project mới bấm được; thư mục source vào Thùng rác (khôi phục được),
 * project, nhiệm vụ, tin nhắn gỡ khỏi hệ thống. Server chặn khi đang có nhiệm vụ chạy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ProjectDeleteForm({ project }: { project: Project }) {
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmed = confirmName.trim() === project.name.trim();
  const remove = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteProject(project.id, confirmName.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setIsDeleting(false);
    }
  };
  return (
    <form
      className="project-field project-delete"
      onSubmit={(event) => {
        event.preventDefault();
        if (isConfirmed) void remove();
      }}
    >
      <label className="muted">Xoá project</label>
      <p className="muted project-field-hint">
        Gỡ project, nhiệm vụ và tin nhắn khỏi hệ thống; thư mục source chuyển vào Thùng rác (khôi phục được bằng &quot;Put Back&quot;). Gõ <strong>{project.name}</strong> để xác nhận.
      </p>
      <div className="project-field-row">
        <input value={confirmName} onChange={(event) => setConfirmName(event.target.value)} placeholder={project.name} spellCheck={false} autoComplete="off" aria-label="Gõ tên project để xác nhận xoá" />
        <button className="button button-danger" type="submit" disabled={!isConfirmed || isDeleting}>
          <Trash2 size={13} aria-hidden /> {isDeleting ? 'Đang xoá…' : 'Xoá'}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
