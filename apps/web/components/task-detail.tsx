'use client';

import { useEffect, useRef, useState } from 'react';

import { Terminal, X } from 'lucide-react';

import { api } from '@/lib/api';
import { STATUS_LABELS, unitLabel } from '@/lib/labels';
import { damageLine, shortModel } from '@/lib/org';
import type { LiveLog } from '@/lib/use-factory';
import type { DamageTotals, Task, TaskEvent } from '@/lib/types';

import { AnswerForm } from './answer-form';

import { TaskActions } from './task-actions';

type TaskDetailProps = {
  task: Task;
  damage: DamageTotals | undefined;
  liveLogs: LiveLog[];
  onClose: () => void;
  onChanged: () => void;
};

/**
 * Chi tiết một task: yêu cầu, kết quả / lỗi, log agent trực tiếp, nút thao tác.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function TaskDetail({ task, damage, liveLogs, onClose, onChanged }: TaskDetailProps) {
  const [history, setHistory] = useState<TaskEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historySeq, setHistorySeq] = useState(0);
  const latestSeq = useRef(0);
  latestSeq.current = liveLogs.at(-1)?.seq ?? 0;

  useEffect(() => {
    let active = true;
    const seqAtRequest = latestSeq.current;
    api
      .taskEvents(task.id)
      .then((events) => {
        if (!active) return;
        setHistory(events);
        setHistorySeq(seqAtRequest);
      })
      .catch((error: unknown) => active && setLoadError(String(error)));
    return () => {
      active = false;
    };
  }, [task.id, task.status]);

  const newLogs = liveLogs.filter((log) => log.taskId === task.id && log.seq > historySeq);
  const logs = [...history.map((event) => ({ kind: event.kind, text: event.text })), ...newLogs];

  return (
    <div className="detail">
      <div className="panel-head">
        <h2>
          #{task.id} {task.title}
        </h2>
        <button className="icon-button is-small" onClick={onClose} aria-label="Bỏ chọn nhiệm vụ">
          <X size={13} />
        </button>
      </div>
      <dl className="kv order">
        <div><dt>giao bởi</dt><dd>{unitLabel(task.assignedBy)}</dd></div>
        <div><dt>người nhận</dt><dd>{unitLabel(task.role)}</dd></div>
        <div><dt>model</dt><dd>{shortModel(task.model, '—')}</dd></div>
        <div><dt>project</dt><dd>{task.projectId}</dd></div>
        <div><dt>trạng thái</dt><dd>{STATUS_LABELS[task.status]}</dd></div>
        <div><dt>thiệt hại</dt><dd>{damageLine(damage)}</dd></div>
      </dl>
      <TaskActions task={task} onChanged={onChanged} />
      {task.status === 'awaiting_answer' ? (
        <>
          <h3>Câu hỏi gửi Chỉ huy trưởng</h3>
          <AnswerForm task={task} onChanged={onChanged} />
        </>
      ) : null}
      <h3>Nhiệm vụ</h3>
      <pre className="block">{task.detail}</pre>
      <h3>Kết quả mong muốn</h3>
      <pre className="block">{task.expected || '—'}</pre>
      <h3>Cách thử</h3>
      <pre className="block">{task.verification || '—'}</pre>
      {task.feedback ? (
        <>
          <h3>Chỉ thị bổ sung đang chờ thực hiện</h3>
          <pre className="block">{task.feedback}</pre>
        </>
      ) : null}
      {task.output ? (
        <>
          <h3>Báo cáo</h3>
          <pre className="block">{task.output}</pre>
        </>
      ) : null}
      {task.error ? (
        <>
          <h3>Lỗi</h3>
          <pre className="block error">{task.error}</pre>
        </>
      ) : null}
      <h3>Nhật ký</h3>
      {loadError ? <p className="error">{loadError}</p> : null}
      {logs.length === 0 ? <p className="muted">Chưa có log.</p> : null}
      <ol className="log">
        {logs.map((log, index) => (
          <li key={index} className={`log-${log.kind}`}>
            {log.kind === 'tool' ? <Terminal size={12} aria-hidden className="log-icon" /> : null}
            {log.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
