import type { ScreenId } from './screens';

export type VoiceIntent =
  | { kind: 'open'; screen: ScreenId }
  | { kind: 'close' }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'briefing' }
  | { kind: 'manager'; text: string };

const MAX_COMMAND_WORDS = 6;

const SCREEN_WORDS: [RegExp, ScreenId][] = [
  [/bao cao bot|ho so bot|ban bao cao|diem manh/, 'bot-reports'],
  [/thiet hai|hau can/, 'damage'],
  [/bao cao cac ban|so bao cao/, 'reports'],
  [/nhat ky|log/, 'log'],
  [/bien che|cay/, 'tree'],
  [/quota|hang doi/, 'quota'],
  [/duyet|cap quyen|cau hoi/, 'approvals'],
  [/lien lac|tham muu/, 'chat'],
];

/**
 * Bỏ dấu, chữ thường, gom khoảng trắng — để so lệnh không phụ thuộc dấu.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function normalizeSpeech(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lệnh giọng nói ngắn do máy tự xử lý (không tốn token): mở/đóng màn hình, tạm dừng,
 * tiếp tục, báo cáo tình hình. Câu dài hoặc không khớp → chuyển Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseVoiceCommand(text: string): VoiceIntent {
  const spoken = normalizeSpeech(text);
  if (!spoken || spoken.split(' ').length > MAX_COMMAND_WORDS) return { kind: 'manager', text };
  if (/^(bao cao )?tinh hinh|^bao cao tinh hinh/.test(spoken)) return { kind: 'briefing' };
  if (/^(tam dung|dung lai|ngung)( hang doi)?$/.test(spoken)) return { kind: 'pause' };
  if (/^(tiep tuc|chay tiep)( hang doi)?$/.test(spoken)) return { kind: 'resume' };
  if (/^(dong|tat)( cua so| man hinh)?$/.test(spoken)) return { kind: 'close' };
  if (/^(mo|xem|hien)\b/.test(spoken)) {
    const match = SCREEN_WORDS.find(([pattern]) => pattern.test(spoken));
    if (match) return { kind: 'open', screen: match[1] };
  }
  return { kind: 'manager', text };
}
