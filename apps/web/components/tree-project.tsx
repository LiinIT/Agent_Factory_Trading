'use client';

import { Ban, Check, CircleDashed, CircleDot, Diamond, type LucideIcon, MessageCircleQuestion, Settings, X } from 'lucide-react';
import { useState } from 'react';

import { STATUS_LABELS, unitLabel } from '@/lib/labels';
import type { Project, Task } from '@/lib/types';

import { ProjectSettings } from './project-settings';

const STATUS_ICONS: Record<Task['status'], LucideIcon> = {
  queued: CircleDashed,
  running: CircleDot,
  awaiting_approval: Diamond,
  awaiting_answer: MessageCircleQuestion,
  done: Check,
  failed: X,
  cancelled: Ban,
};

type TreeProjectProps = {
  project: Project;
  tasks: Task[];
  selectedTaskId: number | null;
  onSelectTask: (taskId: number) => void;
};

/**
 * Nhánh một project trong cây: tiến độ, danh sách task theo thứ tự chạy, nút mở cài đặt
 * nơi lưu + git.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function TreeProject({ project, tasks, selectedTaskId, onSelectTask }: TreeProjectProps) {
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const hasActivity = tasks.some((task) => task.status === 'running' || task.status === 'awaiting_approval');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (
    <li>
      <details open={hasActivity || tasks.length <= 8}>
        <summary>
          <strong>{project.name}</strong>
          <span className="muted"> {doneCount}/{tasks.length} xong</span>
          <button
            className="icon-button project-settings-toggle"
            title="Nơi lưu & git"
            aria-label={`Nơi lưu và git của ${project.name}`}
            aria-expanded={isSettingsOpen}
            onClick={(event) => {
              event.preventDefault();
              setIsSettingsOpen((isOpen) => !isOpen);
            }}
          >
            <Settings size={12} aria-hidden />
          </button>
        </summary>
        {isSettingsOpen ? <ProjectSettings project={project} /> : null}
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                className={`tree-task is-${task.status} ${task.id === selectedTaskId ? 'is-selected' : ''}`}
                onClick={() => onSelectTask(task.id)}
                title={STATUS_LABELS[task.status]}
              >
                <TaskStatusIcon status={task.status} />
                <span className="muted">#{task.id} {unitLabel(task.role)}</span>
                <span className="tree-task-title">{task.title}</span>
                {task.deniedTools.length > 0 ? <span className="badge-warn">quyền</span> : null}
                {task.status === 'awaiting_answer' ? <span className="badge-warn">hỏi</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/**
 * Icon trạng thái của task trong cây.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function TaskStatusIcon({ status }: { status: Task['status'] }) {
  const Icon = STATUS_ICONS[status];
  return <Icon size={12} className="tree-icon" aria-hidden />;
}
