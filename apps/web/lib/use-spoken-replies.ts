'use client';

import { useEffect, useRef } from 'react';

import { toSpeech } from './rich-text';
import type { Message } from './types';

/**
 * Đọc to mỗi câu trả lời mới của Tham mưu trưởng khi bật chế độ đọc to
 * (không đọc lại tin cũ lúc mới mở trang); bỏ ký hiệu tô màu trước khi đọc.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function useSpokenReplies(messages: Message[], isEnabled: boolean, speak: (text: string) => void): void {
  const lastSpokenId = useRef<number | null>(null);
  useEffect(() => {
    const latest = messages.findLast((message) => message.sender === 'manager');
    if (!latest) return;
    if (lastSpokenId.current === null) {
      lastSpokenId.current = latest.id;
      return;
    }
    if (latest.id === lastSpokenId.current) return;
    lastSpokenId.current = latest.id;
    if (isEnabled) speak(toSpeech(latest.text));
  }, [messages, isEnabled, speak]);
}
