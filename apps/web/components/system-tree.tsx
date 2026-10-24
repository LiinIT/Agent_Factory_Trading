'use client';

import { nodeState, roleActivities } from '@/lib/org';
import type { FactoryState } from '@/lib/types';

import { TreeProject } from './tree-project';

type SystemTreeProps = {
  state: FactoryState;
  selectedTaskId: number | null;
  onSelectTask: (taskId: number) => void;
};

/**
 * Cây biên chế: Tham mưu trưởng (Brain) → các ban → project → nhiệm vụ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function SystemTree({ state, selectedTaskId, onSelectTask }: SystemTreeProps) {
  const activities = roleActivities(state);
  return (
    <section className="tree" aria-label="Cây hệ thống">
      <ul className="tree-root">
        <li>
          <details open>
            <summary>
              <span className={`status-dot is-${state.managerBusy ? 'working' : 'idle'}`} />
              <strong>Tham mưu trưởng · Brain</strong>
              <span className="muted"> {state.managerBusy ? 'đang xử lý' : 'sẵn sàng'}</span>
            </summary>
            <ul>
              <li>
                <details open>
                  <summary>Biên chế <span className="muted">({activities.length} ban)</span></summary>
                  <ul>
                    {activities.map((activity) => (
                      <li key={activity.role.name} className="tree-leaf">
                        <span className={`status-dot is-${nodeState(activity)}`} />
                        <span>{activity.role.unit}</span>
                        <span className="muted"> · {activity.role.title}</span>
                        {activity.running ? (
                          <button className="tree-link" onClick={() => activity.running && onSelectTask(activity.running.id)}>
                            #{activity.running.id}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
              <li>
                <details open>
                  <summary>Project <span className="muted">({state.projects.length})</span></summary>
                  {state.projects.length === 0 ? <p className="muted tree-empty">Chưa có project — ra lệnh cho Tham mưu trưởng để bắt đầu.</p> : null}
                  <ul>
                    {state.projects.map((project) => (
                      <TreeProject
                        key={project.id}
                        project={project}
                        tasks={state.tasks.filter((task) => task.projectId === project.id)}
                        selectedTaskId={selectedTaskId}
                        onSelectTask={onSelectTask}
                      />
                    ))}
                  </ul>
                </details>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </section>
  );
}
