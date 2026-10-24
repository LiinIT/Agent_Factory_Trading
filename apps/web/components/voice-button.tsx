'use client';

import { Mic, MicOff, Radio } from 'lucide-react';

type VoiceButtonProps = {
  isSupported: boolean;
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
};

/**
 * Nút "giữ để nói": nhấn giữ (chuột, chạm hoặc phím Space khi đang focus) để nghe, thả ra để gửi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function VoiceButton({ isSupported, isListening, onStart, onStop }: VoiceButtonProps) {
  if (!isSupported) {
    return (
      <span className="muted inline-icon" title="Dùng Chrome hoặc Safari để nói">
        <MicOff size={14} aria-hidden /> Trình duyệt chưa hỗ trợ giọng nói
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`button ${isListening ? 'button-live' : ''}`}
      onPointerDown={onStart}
      onPointerUp={onStop}
      onPointerLeave={() => isListening && onStop()}
      onKeyDown={(event) => event.key === ' ' && !event.repeat && onStart()}
      onKeyUp={(event) => event.key === ' ' && onStop()}
      aria-pressed={isListening}
    >
      {isListening ? <Radio size={14} aria-hidden /> : <Mic size={14} aria-hidden />}
      {isListening ? 'Đang nghe… thả để gửi' : 'Giữ để nói'}
    </button>
  );
}
