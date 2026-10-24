'use client';

import { tasksNeedingOwner } from '@/lib/org';
import type { ScreenId } from '@/lib/screens';
import type { LiveLog } from '@/lib/use-factory';
import type { FactoryState } from '@/lib/types';

import { ActivityLog } from '../activity-log';
import { ApprovalItem } from '../approval-item';
import { ChatPanel } from '../chat-panel';
import { SystemTree } from '../system-tree';
import { TaskDetail } from '../task-detail';
import { DamageScreen } from './damage-screen';
import { EnvScreen } from './env-screen';
import { QuotaScreen } from './quota-screen';
import { ReportsScreen } from './reports-screen';
import { BotReportScreen } from './bot-report-screen';

export type ScreenContentProps = {
  id: ScreenId;
  state: FactoryState;
  liveLogs: LiveLog[];
  selectedTaskId: number | null;
  projectId: string | null;
  onSelectTask: (taskId: number | null) => void;
  onProjectChange: (projectId: string | null) => void;
  onTogglePause: () => void;
  onChanged: () => void;
};

/**
 * Nội dung của từng màn hình phụ, dùng lại các component sẵn có.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ScreenContent(props: ScreenContentProps) {
  const { id, state, liveLogs, selectedTaskId, projectId, onSelectTask, onProjectChange, onTogglePause, onChanged } = props;
  const selectedTask = state.tasks.find((task) => task.id === selectedTaskId) ?? null;
  if (id === 'chat') {
    return (
      <ChatPanel
        messages={state.messages}
        projects={state.projects}
        projectId={projectId}
        managerBusy={state.managerBusy}
        onProjectChange={onProjectChange}
      />
    );
  }
  if (id === 'approvals') {
    const pending = tasksNeedingOwner(state.tasks);
    return (
      <div className="approvals">
        {pending.length === 0 ? <p className="muted">Không có việc chờ Chỉ huy trưởng.</p> : null}
        {pending.map((task) => (
          <ApprovalItem
            key={task.id}
            task={task}
            projectPath={state.projects.find((project) => project.id === task.projectId)?.path ?? null}
            onSelect={onSelectTask}
            onChanged={onChanged}
          />
        ))}
      </div>
    );
  }
  if (id === 'log') {
    return selectedTask ? (
      <TaskDetail
        task={selectedTask}
        damage={state.damage.byTask[String(selectedTask.id)]}
        liveLogs={liveLogs}
        onClose={() => onSelectTask(null)}
        onChanged={onChanged}
      />
    ) : (
      <ActivityLog liveLogs={liveLogs} messages={state.messages} onSelectTask={onSelectTask} />
    );
  }
  if (id === 'tree') return <SystemTree state={state} selectedTaskId={selectedTaskId} onSelectTask={onSelectTask} />;
  if (id === 'reports') return <ReportsScreen messages={state.messages} projectId={projectId} />;
  if (id === 'damage') return <DamageScreen state={state} />;
  if (id === 'bot-reports') return <BotReportScreen state={state} />;
  if (id === 'env') return <EnvScreen />;
  return <QuotaScreen state={state} onTogglePause={onTogglePause} />;
}
