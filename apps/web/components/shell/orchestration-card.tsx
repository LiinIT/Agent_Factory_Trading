'use client';

import { ChevronRight, LoaderCircle, MessagesSquare } from 'lucide-react';

import { unitLabel } from '@/lib/labels';
import { damageLine, shortModel, tasksNeedingOwner, truncate } from '@/lib/org';
import { roleIcon } from '@/lib/role-icons';
import type { LiveLog } from '@/lib/use-factory';
import { formatElapsed, useNow } from '@/lib/use-now';
import type { FactoryState } from '@/lib/types';

import { DecisionCard } from './decision-card';

const THOUGHT_MAX = 240;
const LOG_MAX = 110;
const REPORT_LINES = 4;
const CLOCK_INTERVAL_MS = 1000;

type OrchestrationCardProps = {
  state: FactoryState;
  liveLogs: LiveLog[];
  onOpenApprovals: () => void;
  onOpenChat: () => void;
  onOpenReports: () => void;
  onOpenDamage: () => void;
  onSelectTask: (taskId: number) => void;
  onChanged: () => void;
};

/**
 * Thẻ Điều phối (theo theme1 "Reasoning & orchestration"): chuỗi chỉ huy đang chạy,
 * Tham mưu trưởng báo cáo gì, việc cần Chỉ huy trưởng quyết, báo cáo mới nhất,
 * ban nào đang xử lý gì bằng model nào, thiệt hại hôm nay.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function OrchestrationCard(props: OrchestrationCardProps) {
  const { state, liveLogs, onOpenApprovals, onOpenChat, onOpenReports, onOpenDamage, onSelectTask, onChanged } = props;
  const now = useNow(CLOCK_INTERVAL_MS);
  const latestThought = [...state.messages].reverse().find((message) => message.sender === 'manager');
  const latestReport = [...state.messages].reverse().find((message) => message.sender === 'report');
  const pending = tasksNeedingOwner(state.tasks);
  const running = state.tasks.filter((task) => task.status === 'running');
  const chain = running.length > 0 ? running.map((task) => unitLabel(task.role)).join(', ') : 'chưa giao';

  return (
    <aside className="orchestration" aria-label="Điều phối">
      <p className="column-title">Điều phối</p>
      <div className="orch-card">
        <section className="orch-section">
          <h3>Chuỗi chỉ huy</h3>
          <p className="chain">
            <span>Chỉ huy trưởng</span>
            <ChevronRight size={12} aria-hidden />
            <span className={state.managerBusy ? 'accent' : ''}>Tham mưu trưởng</span>
            <ChevronRight size={12} aria-hidden />
            <span className={running.length > 0 ? 'accent' : 'muted'}>{chain}</span>
          </p>
        </section>

        <section className="orch-section">
          <h3>
            {state.managerBusy ? <LoaderCircle size={13} className="spin accent" aria-hidden /> : null}
            Tham mưu trưởng báo cáo
          </h3>
          <p className="orch-text">
            {state.managerBusy ? 'Đang xử lý báo cáo, lập lệnh…' : truncate(latestThought?.text ?? 'Chờ lệnh của Chỉ huy trưởng.', THOUGHT_MAX)}
          </p>
          <button className="text-button" onClick={onOpenChat}>
            <MessagesSquare size={13} aria-hidden /> Liên lạc Tham mưu trưởng
          </button>
        </section>

        <section className="orch-section">
          <h3>Cần Chỉ huy trưởng quyết {pending.length > 1 ? <span className="muted">+{pending.length - 1}</span> : null}</h3>
          {pending[0] ? (
            <DecisionCard task={pending[0]} onOpenApprovals={onOpenApprovals} onSelectTask={onSelectTask} onChanged={onChanged} />
          ) : (
            <p className="orch-text muted">Không có việc chờ.</p>
          )}
        </section>

        <section className="orch-section">
          <h3>Đang xử lý</h3>
          {running.length === 0 ? <p className="orch-text muted">Các ban sẵn sàng nhận lệnh.</p> : null}
          {running.map((task) => {
            const Icon = roleIcon(task.role);
            const lastLog = [...liveLogs].reverse().find((log) => log.taskId === task.id);
            const role = state.team.find((item) => item.name === task.role);
            return (
              <button key={task.id} className="worker" onClick={() => onSelectTask(task.id)}>
                <span className="worker-head">
                  <Icon size={13} aria-hidden className="accent" />
                  <span className="worker-title">{unitLabel(task.role)} · #{task.id} {task.title}</span>
                  <span className="rail-time">{formatElapsed(task.startedAt, now)}</span>
                </span>
                <span className="worker-meta">model {shortModel(task.model, role?.model ?? '?')} · giao bởi Tham mưu trưởng</span>
                <span className="worker-log">{lastLog ? `$ ${truncate(lastLog.text, LOG_MAX)}` : '$ đang khởi động…'}</span>
              </button>
            );
          })}
        </section>

        <section className="orch-section">
          <h3>Báo cáo mới</h3>
          {latestReport ? (
            <button className="report-peek" onClick={onOpenReports}>
              <pre>{latestReport.text.split('\n').slice(0, REPORT_LINES).join('\n')}</pre>
            </button>
          ) : (
            <p className="orch-text muted">Chưa có báo cáo.</p>
          )}
        </section>

        <section className="orch-section">
          <h3>Thiệt hại hôm nay</h3>
          <button className="text-button" onClick={onOpenDamage}>
            {damageLine(state.damage.today)} · {state.damage.today.runs} lượt
          </button>
        </section>
      </div>
    </aside>
  );
}
