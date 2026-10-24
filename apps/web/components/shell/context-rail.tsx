'use client';

import { focusTaskOf, nodeState, roleActivities, shortModel, truncate } from '@/lib/org';
import { roleIcon } from '@/lib/role-icons';
import { formatElapsed, useNow } from '@/lib/use-now';
import type { FactoryState } from '@/lib/types';

const CLOCK_INTERVAL_MS = 1000;
const TITLE_MAX = 30;
const PERCENT = 100;

const STATE_HINTS: Record<string, string> = {
  working: 'đang làm',
  asking: 'xin ý kiến',
  waiting: 'chờ duyệt',
  blocked: 'lỗi / bị chặn',
  idle: 'sẵn sàng',
};

type ContextRailProps = {
  state: FactoryState;
  onSelectTask: (taskId: number) => void;
  onOpenSystem: () => void;
};

/**
 * Cột Context (theo theme1): ban nào nhận nhiệm vụ gì, do ai giao, dùng model nào,
 * chạy bao lâu; tiến độ từng project. Ban đang hoạt động nổi lên thành thẻ sáng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ContextRail({ state, onSelectTask, onOpenSystem }: ContextRailProps) {
  const now = useNow(CLOCK_INTERVAL_MS);
  const activities = roleActivities(state);
  return (
    <aside className="rail" aria-label="Context">
      <p className="column-title">Biên chế</p>
      <ul className="rail-list">
        {activities.map((activity) => {
          const visualState = nodeState(activity);
          const Icon = roleIcon(activity.role.name);
          const focusTask = focusTaskOf(activity);
          return (
            <li key={activity.role.name}>
              <button className={`rail-item is-${visualState}`} onClick={() => (focusTask ? onSelectTask(focusTask.id) : onOpenSystem())}>
                <span className="rail-dot" aria-hidden />
                <Icon size={14} aria-hidden />
                <span className="rail-text">
                  <span className="rail-name">{activity.role.unit}</span>
                  <span className="rail-detail">
                    {focusTask ? truncate(`#${focusTask.id} ${focusTask.title}`, TITLE_MAX) : `${STATE_HINTS[visualState]} · chờ ${activity.queued}`}
                  </span>
                  {focusTask ? (
                    <span className="rail-meta">
                      {STATE_HINTS[visualState]} · nhận từ Tham mưu trưởng · {shortModel(focusTask.model, activity.role.model)}
                    </span>
                  ) : null}
                </span>
                {activity.running ? <span className="rail-time">{formatElapsed(activity.running.startedAt, now)}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="column-title">Project</p>
      {state.projects.length === 0 ? <p className="muted rail-empty">Chưa có project. Ra lệnh cho Tham mưu trưởng để bắt đầu.</p> : null}
      <ul className="rail-list">
        {state.projects.map((project) => {
          const tasks = state.tasks.filter((task) => task.projectId === project.id);
          const done = tasks.filter((task) => task.status === 'done').length;
          const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * PERCENT);
          const isActive = tasks.some((task) => task.status === 'running');
          return (
            <li key={project.id}>
              <button className={`rail-item rail-project ${isActive ? 'is-working' : 'is-idle'}`} onClick={onOpenSystem}>
                <span className="rail-text">
                  <span className="rail-name">{project.name}</span>
                  <span className="rail-progress" aria-label={`${percent}% xong`}>
                    <i style={{ width: `${percent}%` }} />
                  </span>
                </span>
                <span className="rail-time">{done}/{tasks.length}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
