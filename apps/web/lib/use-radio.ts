'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useVoice } from './use-voice';
import { parseVoiceCommand, type VoiceIntent } from './voice-commands';

const NOTICE_MS = 4000;

/**
 * Bộ đàm toàn cục: giữ để nói → nhận câu → phân loại lệnh máy / lệnh gửi Tham mưu
 * trưởng → gọi [onIntent]. Có dòng thông báo ngắn sau mỗi lần thả và hàm đọc to.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function useRadio(onIntent: (intent: VoiceIntent, heard: string) => string) {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIntentRef = useRef(onIntent);
  onIntentRef.current = onIntent;

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const voice = useVoice((heard) => showNotice(onIntentRef.current(parseVoiceCommand(heard), heard)));

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (voice.voiceError) showNotice(voice.voiceError);
  }, [voice.voiceError, showNotice]);

  return { ...voice, notice, showNotice };
}
