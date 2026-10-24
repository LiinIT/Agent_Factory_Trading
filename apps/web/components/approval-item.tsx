import { Map as MapIcon } from 'lucide-react';

import { STATUS_LABELS, unitLabel } from '@/lib/labels';
import { truncate } from '@/lib/org';
import type { Task } from '@/lib/types';

import { AnswerForm } from './answer-form';
import { PermissionGrant } from './permission-grant';
import { ReportTiers } from './report-tiers';
import { TaskActions } from './task-actions';

const PREVIEW_LENGTH = 500;

type ApprovalItemProps = {
  task: Task;
  projectPath: string | null;
  onSelect: (taskId: number) => void;
  onOpenSandbox: () => void;
  onChanged: () => void;
};

/**
 * Một việc cần Chỉ huy trưởng: báo cáo phân tầng (đọc ngay → tóm tắt → chi tiết), xem GUI demo,
 * trả lời câu hỏi, duyệt, cấp quyền.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ApprovalItem({ task, projectPath, onSelect, onOpenSandbox, onChanged }: ApprovalItemProps) {
  const summary = task.error ?? task.output ?? '';
  const isSandboxReview = task.role === 'ngoai-giao' && task.status === 'awaiting_approval';
  return (
    <article className={`approval is-${task.status}`}>
      <header className="approval-head">
        <button className="tree-link" onClick={() => onSelect(task.id)}>
          #{task.id} {task.title}
        </button>
        <span className="muted">{unitLabel(task.role)} · {task.projectId} · {STATUS_LABELS[task.status]}</span>
      </header>
      <ReportTiers task={task} projectPath={projectPath} fallback={truncate(summary, PREVIEW_LENGTH)} />
      {isSandboxReview ? (
        <button className="button" onClick={onOpenSandbox}>
          <MapIcon size={13} aria-hidden /> Xem GUI demo trước khi duyệt
        </button>
      ) : null}
      {task.status === 'awaiting_answer' ? <AnswerForm task={task} onChanged={onChanged} /> : null}
      <TaskActions task={task} onChanged={onChanged} />
      {task.deniedTools.length > 0 ? <PermissionGrant task={task} onChanged={onChanged} /> : null}
    </article>
  );
}
