import type { Message } from '@/lib/types';

import { RichText } from './rich-text';

const SENDER_LABELS: Record<Message['sender'], string> = {
  user: 'Chỉ huy trưởng',
  manager: 'Tham mưu trưởng',
  system: 'Ban Thông tin',
  report: 'Báo cáo',
  logistics: 'Ban Hậu cần',
};

/**
 * Một tin nhắn trong khung chat; tin của hệ thống / Tham mưu trưởng hiển thị có màu, từng ý một dòng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`bubble bubble-${message.sender}`}>
      <span className="bubble-sender">
        {SENDER_LABELS[message.sender]}
        {message.projectId ? <span className="muted"> · {message.projectId}</span> : null}
      </span>
      {message.sender === 'user' ? <p>{message.text}</p> : <RichText text={message.text} />}
    </div>
  );
}
