import { Flag, Terminal } from 'lucide-react';

import type { LiveLog } from '@/lib/use-factory';
import type { Message } from '@/lib/types';

const SYSTEM_MESSAGE_LIMIT = 30;
const LIVE_LOG_LIMIT = 120;

type ActivityLogProps = {
  liveLogs: LiveLog[];
  messages: Message[];
  onSelectTask: (taskId: number) => void;
};

/**
 * Log toàn hệ thống khi chưa chọn task: thông báo hệ thống + thao tác trực tiếp của agent.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ActivityLog({ liveLogs, messages, onSelectTask }: ActivityLogProps) {
  const systemMessages = messages.filter((message) => message.sender === 'system').slice(-SYSTEM_MESSAGE_LIMIT);
  const recentLogs = liveLogs.slice(-LIVE_LOG_LIMIT);
  if (systemMessages.length === 0 && recentLogs.length === 0) {
    return <p className="muted">Chưa có hoạt động. Chọn một task trong cây hoặc sơ đồ để xem log chi tiết.</p>;
  }
  return (
    <div className="activity">
      <ol className="log">
        {systemMessages.map((message) => (
          <li key={`m${message.id}`} className="log-system">
            <Flag size={12} aria-hidden className="log-icon" />
            {message.text}
          </li>
        ))}
        {recentLogs.map((log) => (
          <li key={`l${log.seq}`} className={`log-${log.kind}`}>
            <button className="tree-link" onClick={() => onSelectTask(log.taskId)}>#{log.taskId}</button>{' '}
            {log.kind === 'tool' ? <Terminal size={12} aria-hidden className="log-icon" /> : null}
            {log.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
