import { unitLabel } from '@/lib/labels';
import type { Message } from '@/lib/types';

const REPORT_LIMIT = 60;

type ReportsScreenProps = {
  messages: Message[];
  projectId: string | null;
};

/**
 * Sổ báo cáo: báo cáo của các ban gửi Tham mưu trưởng và báo cáo thiệt hại của
 * Ban Hậu cần, mới nhất ở trên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ReportsScreen({ messages, projectId }: ReportsScreenProps) {
  const reports = messages
    .filter((message) => message.sender === 'report' || message.sender === 'logistics')
    .filter((message) => !projectId || message.projectId === projectId)
    .slice(-REPORT_LIMIT)
    .reverse();
  if (reports.length === 0) return <p className="muted">Chưa có báo cáo nào.</p>;
  return (
    <div className="reports">
      {reports.map((message) => (
        <article key={message.id} className={`report-card is-${message.sender}`}>
          <header className="report-head">
            <span>{message.author ? unitLabel(message.author) : message.sender}</span>
            <span className="muted">
              {message.projectId ?? ''} · {message.createdAt.slice(11, 16)}
            </span>
          </header>
          <pre className="block">{message.text}</pre>
        </article>
      ))}
    </div>
  );
}
