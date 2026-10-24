import { log } from './logger.ts';
import type { FactoryStore } from './store.ts';
import type { RoleDefinition } from './types.ts';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const OLLAMA_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 220;
const MAX_BRIEFING_LENGTH = 600;
const OPENING = 'Báo cáo Thủ trưởng:';
const ACCEPTED_OPENINGS = [OPENING, 'Báo cáo Chỉ huy trưởng:'];

export type Briefing = { text: string; source: 'ollama' | 'may' };

/**
 * Dữ kiện tình hình do máy tự tổng hợp (không tốn token): ai đang làm gì, việc chờ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function situationFacts(store: FactoryStore, team: Map<string, RoleDefinition>): string {
  const tasks = store.listTasks();
  const unit = (role: string) => team.get(role)?.unit ?? role;
  const running = tasks.filter((task) => task.status === 'running');
  const approvals = tasks.filter((task) => task.status === 'awaiting_approval');
  const questions = tasks.filter((task) => task.status === 'awaiting_answer');
  const failed = tasks.filter((task) => task.status === 'failed');
  const queued = tasks.filter((task) => task.status === 'queued').length;
  const lines = [
    running.length > 0 ? `Đang làm: ${running.map((task) => `${unit(task.role)} nhiệm vụ ${task.id} ${task.title}`).join('; ')}.` : 'Không ban nào đang làm.',
    `Hàng đợi ${queued} nhiệm vụ.`,
  ];
  if (approvals.length > 0) lines.push(`Chờ duyệt ${approvals.length}: ${approvals.map((task) => `${unit(task.role)} ${task.title}`).join('; ')}.`);
  if (questions.length > 0) lines.push(`Có ${questions.length} nhiệm vụ xin ý kiến Thủ trưởng.`);
  if (failed.length > 0) lines.push(`${failed.length} nhiệm vụ lỗi cần lệnh.`);
  return lines.join(' ');
}

/**
 * Báo cáo tình hình để đọc to: model chạy trên máy (Ollama) viết lại cho gọn theo
 * văn phong quân đội. Bản viết lại chỉ được dùng khi qua kiểm tra (đúng mẫu mở đầu,
 * giữ đủ mọi con số); không thì đọc nguyên dữ kiện máy. Không tốn quota Claude.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export async function buildBriefing(facts: string, localModel: string): Promise<Briefing> {
  const fallback: Briefing = { text: `${OPENING} ${facts}`, source: 'may' };
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
      body: JSON.stringify({
        model: localModel,
        stream: false,
        think: false,
        options: { num_predict: MAX_TOKENS, temperature: 0.1 },
        messages: [
          { role: 'system', content: 'Bạn là sĩ quan tham mưu Việt Nam. Chỉ trả lời bằng tiếng Việt có dấu, không giải thích.' },
          {
            role: 'user',
            content: `Viết lại dữ kiện sau thành báo cáo miệng tối đa 3 câu, văn phong quân đội, mở đầu "${OPENING}", giữ nguyên mọi con số, không thêm thông tin.\n\nDữ kiện: ${facts}`,
          },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const data = (await response.json()) as { message?: { content?: string } };
    const text = (data.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/\s+/g, ' ').trim();
    return isFaithful(text, facts) ? { text, source: 'ollama' } : fallback;
  } catch (error) {
    log.warn({ err: error }, '[Briefing] Ollama không phản hồi, dùng dữ kiện máy');
    return fallback;
  }
}

/**
 * Bản viết lại có trung thành không: đúng mẫu mở đầu, không quá dài, đủ mọi con số của dữ kiện.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function isFaithful(text: string, facts: string): boolean {
  if (!ACCEPTED_OPENINGS.some((opening) => text.startsWith(opening)) || text.length > MAX_BRIEFING_LENGTH) return false;
  const numbers = (value: string) => (value.match(/\d+/g) ?? []).toSorted();
  const expected = numbers(facts);
  const actual = numbers(text);
  return expected.every((number) => actual.includes(number));
}
