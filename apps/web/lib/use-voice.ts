'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LANGUAGE = 'vi-VN';
const PREFERRED_VOICE = 'Linh';

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

const VOICE_ERRORS: Record<string, string> = {
  'not-allowed': 'Micro bị chặn: bấm biểu tượng ổ khoá trên thanh địa chỉ → Micro: Cho phép; macOS: System Settings › Privacy & Security › Microphone → bật cho trình duyệt.',
  'service-not-allowed': 'Trình duyệt chặn dịch vụ nhận dạng giọng nói — mở bằng http://localhost hoặc https, không dùng địa chỉ IP.',
  'audio-capture': 'Không tìm thấy micro — kiểm tra micro đã cắm / chọn đúng thiết bị vào.',
  network: 'Nhận dạng giọng nói cần mạng (Chrome gửi âm thanh tới máy chủ Google) — kiểm tra kết nối.',
  'no-speech': 'Không nghe thấy tiếng nói — giữ phím lâu hơn và nói gần micro.',
  aborted: 'Đã dừng nghe.',
};

/**
 * Câu hướng dẫn tiếng Việt cho mã lỗi của SpeechRecognition.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function describeVoiceError(code: string): string {
  return VOICE_ERRORS[code] ?? `Lỗi micro: ${code}`;
}

/**
 * Trang có chạy trong secure context không (micro chỉ dùng được trên https / localhost).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function isMicAllowedContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

/**
 * Lấy SpeechRecognition của trình duyệt (Chrome/Safari có tiền tố webkit).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as Record<string, RecognitionConstructor | undefined>;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/**
 * Giọng nói kiểu "giữ để nói": giữ nút thì nghe tiếng Việt, thả ra thì trả câu
 * cuối cùng qua [onFinal]. Kèm hàm đọc to câu trả lời bằng giọng tiếng Việt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function useVoice(onFinal: (text: string) => void) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const transcript = useRef('');
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setIsSupported(recognitionConstructor() !== null);
  }, []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!isMicAllowedContext()) {
      setVoiceError(`Trang đang mở ở ${window.location.origin} — không phải secure context nên trình duyệt chặn micro. Mở http://localhost:7401 hoặc chạy npm run web:https.`);
      return;
    }
    if (!Constructor || recognition.current) return;
    const instance = new Constructor();
    instance.lang = LANGUAGE;
    instance.interimResults = true;
    instance.continuous = true;
    transcript.current = '';
    instance.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = 0; index < event.results.length; index++) {
        const result = event.results[index];
        if (!result) continue;
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      transcript.current = finalText;
      setInterim(`${finalText}${interimText}`);
    };
    instance.onerror = (event) => setVoiceError(describeVoiceError(event.error));
    instance.onend = () => {
      recognition.current = null;
      setIsListening(false);
      const text = transcript.current.trim();
      setInterim('');
      if (text) onFinalRef.current(text);
    };
    recognition.current = instance;
    setVoiceError(null);
    setIsListening(true);
    instance.start();
  }, []);

  const stop = useCallback(() => recognition.current?.stop(), []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.name.includes(PREFERRED_VOICE)) ?? voices.find((item) => item.lang.startsWith('vi'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  return { isSupported, isListening, interim, voiceError, start, stop, speak };
}
