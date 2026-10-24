'use client';

import { Check, KeyRound, MessageCircleQuestion, X } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { STATUS_LABELS, unitLabel } from '@/lib/labels';
import { truncate } from '@/lib/org';
import type { Task } from '@/lib/types';

const SUMMARY_MAX = 150;

type DecisionCardProps = {
  task: Task;
  onOpenApprovals: () => void;
  onSelectTask: (taskId: number) => void;
  onChanged: () => void;
};

/**
 * Việc đầu tiên cần Chỉ huy trưởng quyết: duyệt nhanh, xem GUI demo, trả lời câu hỏi
 * hoặc cấp quyền (mở màn hình đầy đủ).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function DecisionCard({ task, onOpenApprovals, onSelectTask, onChanged }: DecisionCardProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const approve = async () => {
    try {
      await api.taskAction(task.id, 'approve');
      setActionError(null);
      onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };
  const summary = task.status === 'awaiting_answer' ? task.questions.join(' · ') : (task.report?.evidence ?? task.error ?? task.detail);
  return (
    <div className={`decision is-${task.status}`}>
      <button className="decision-title" onClick={() => onSelectTask(task.id)}>
        #{task.id} {task.title}
      </button>
      <p className="muted small">{unitLabel(task.role)} · {STATUS_LABELS[task.status]}</p>
      <p className="orch-text">{truncate(summary, SUMMARY_MAX)}</p>
      <div className="decision-actions">
        {task.status === 'awaiting_answer' ? (
          <button className="round-button is-key" onClick={onOpenApprovals} aria-label="Trả lời câu hỏi" title="Trả lời câu hỏi">
            <MessageCircleQuestion size={14} />
          </button>
        ) : null}
        {task.deniedTools.length > 0 ? (
          <button className="round-button is-key" onClick={onOpenApprovals} aria-label="Cấp quyền" title="Cấp quyền">
            <KeyRound size={14} />
          </button>
        ) : null}
        {task.status === 'awaiting_approval' ? (
          <button className="round-button is-ok" onClick={() => void approve()} aria-label="Duyệt" title="Duyệt">
            <Check size={14} />
          </button>
        ) : null}
        <button className="round-button" onClick={onOpenApprovals} aria-label="Trả lại hoặc xem chi tiết" title="Trả lại / chi tiết">
          <X size={14} />
        </button>
      </div>
      {actionError ? <p className="error">{actionError}</p> : null}
    </div>
  );
}
