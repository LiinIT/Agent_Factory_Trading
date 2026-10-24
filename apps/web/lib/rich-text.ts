export const REPORT_TAG = '[ BÁO CÁO ]';

export type Tone = 'plain' | 'highlight' | 'warn' | 'ok' | 'fail' | 'ask';
export type InlinePart = { text: string; tone: Tone };
export type RichLine = { kind: 'report' | 'item' | 'text'; parts: InlinePart[] };

const INLINE_MARK = /(\*\*[^*\n]+\*\*|!![^!\n]+!!|KHÔNG ĐẠT|CẦN HỎI|ĐẠT)/g;
const ITEM_PREFIX = /^[-•]\s+/;
const STATUS_TONES: Record<string, Tone> = { 'KHÔNG ĐẠT': 'fail', 'CẦN HỎI': 'ask', ĐẠT: 'ok' };

/**
 * Tách một dòng thành các đoạn có màu: `**…**` nhấn, `!!…!!` cảnh báo, ĐẠT / KHÔNG ĐẠT / CẦN HỎI theo trạng thái.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseInline(text: string): InlinePart[] {
  return text
    .split(INLINE_MARK)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return { text: part.slice(2, -2), tone: 'highlight' };
      if (part.startsWith('!!') && part.endsWith('!!') && part.length > 4) return { text: part.slice(2, -2), tone: 'warn' };
      return { text: part, tone: STATUS_TONES[part] ?? 'plain' };
    });
}

/**
 * Tách câu trả lời thành dòng: dòng `[ BÁO CÁO ]`, dòng ý (`- ` / `• `), dòng thường; bỏ dòng trống.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseRich(text: string): RichLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith(REPORT_TAG)) return { kind: 'report', parts: parseInline(line.slice(REPORT_TAG.length).trim()) };
      if (ITEM_PREFIX.test(line)) return { kind: 'item', parts: parseInline(line.replace(ITEM_PREFIX, '')) };
      return { kind: 'text', parts: parseInline(line) };
    });
}

/**
 * Bản để đọc to: bỏ ký hiệu đánh dấu và gạch đầu dòng, `[ BÁO CÁO ]` đọc thành "Báo cáo".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function toSpeech(text: string): string {
  return parseRich(text)
    .map((line) => {
      const sentence = line.parts.map((part) => part.text).join('');
      return line.kind === 'report' ? `Báo cáo. ${sentence}` : sentence;
    })
    .join('\n');
}
