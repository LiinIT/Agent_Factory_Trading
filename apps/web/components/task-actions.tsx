'use client';

import { useState } from 'react';

import { api, type TaskAction } from '@/lib/api';
import type { Task } from '@/lib/types';

type TaskActionsProps = {
  task: Task;
  onChanged: () => void;
};

/**
 * Nút thao tác theo trạng thái: Duyệt / Trả lại (kèm chỉ thị) / Thử lại / Bỏ.
 * Cổng duyệt bắt buộc bấm tay — không có lệnh giọng nói nào làm thay được.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function TaskActions({ task, onChanged }: TaskActionsProps) {
  const [feedback, setFeedback] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: TaskAction) => {
    try {
      await api.taskAction(task.id, action, action === 'reject' ? feedback : undefined);
      setActionError(null);
      setIsRejecting(false);
      setFeedback('');
      onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const canReject = task.status === 'awaiting_approval' || task.status === 'done';
  const canCancel = ['queued', 'failed', 'awaiting_approval', 'awaiting_answer'].includes(task.status);
  return (
    <div className="actions">
      <div className="action-row">
        {task.status === 'awaiting_approval' ? (
          <button className="button button-primary" onClick={() => void run('approve')}>Duyệt</button>
        ) : null}
        {canReject ? (
          <button className="button" onClick={() => setIsRejecting((value) => !value)}>Trả lại</button>
        ) : null}
        {task.status === 'failed' ? <button className="button button-primary" onClick={() => void run('retry')}>Thử lại</button> : null}
        {canCancel ? (
          <button className="button button-danger" onClick={() => void run('cancel')}>Bỏ nhiệm vụ</button>
        ) : null}
      </div>
      {isRejecting ? (
        <div className="reject">
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Chỉ thị sửa: ban sẽ làm lại đúng theo chỉ thị này."
            rows={3}
          />
          <button className="button button-primary" disabled={!feedback.trim()} onClick={() => void run('reject')}>
            Gửi chỉ thị
          </button>
        </div>
      ) : null}
      {actionError ? <p className="error">{actionError}</p> : null}
    </div>
  );
}
