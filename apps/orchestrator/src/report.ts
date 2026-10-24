import type { AgentReport, DamageTotals, ReportResult, RunRecord } from './types.ts';

const RESULTS: ReportResult[] = ['ĐẠT', 'KHÔNG ĐẠT', 'CẦN HỎI'];
const PERCENT = 100;
const MS_PER_SECOND = 1000;
const TOKENS_PER_K = 1000;

export const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mission', 'result', 'evidence', 'obstacles', 'questions', 'proposal', 'howToRun'],
  properties: {
    mission: { type: 'string', description: 'Nhiệm vụ đã nhận, 1 dòng' },
    result: { type: 'string', enum: RESULTS },
    evidence: { type: 'string', description: 'Bằng chứng: lệnh + kết quả, số test pass, file đã ghi' },
    obstacles: { type: 'string', description: 'Vướng mắc còn lại, hoặc "Không"' },
    questions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Câu hỏi cho Chỉ huy trưởng, mỗi câu một mục; cuối câu ghi 2–4 đáp án gợi ý để bấm chọn nhanh, dạng "...? [Đáp án A | Đáp án B | Đáp án C]"',
    },
    proposal: { type: 'string', description: 'Đề xuất bước tiếp theo, 1 dòng' },
    howToRun: {
      type: 'string',
      description: 'Cách Chỉ huy trưởng tự chạy / xem kết quả: lệnh chạy từ thư mục project (mỗi lệnh một dòng) hoặc file cần mở; không có gì để chạy thì "Không"',
    },
  },
} as const;

/**
 * Đọc báo cáo JSON của một ban; sai định dạng thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function parseReport(value: unknown): AgentReport | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const text = (key: string) => (typeof data[key] === 'string' ? (data[key] as string).trim() : '');
  const result = RESULTS.find((item) => item === data.result);
  if (!result) return null;
  const questions = Array.isArray(data.questions)
    ? data.questions.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
  return {
    mission: text('mission'),
    result: questions.length > 0 ? 'CẦN HỎI' : result,
    evidence: text('evidence'),
    obstacles: text('obstacles') || 'Không',
    questions,
    proposal: text('proposal'),
    howToRun: text('howToRun') || 'Không',
  };
}

export type ReportHeader = {
  taskId: number;
  unit: string;
  model: string | null;
  assignedBy: string;
  expected: string;
  verification: string;
};

/**
 * Văn bản báo cáo chuẩn quân đội gửi Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatReport(header: ReportHeader, report: AgentReport): string {
  const lines = [
    `BÁO CÁO #${header.taskId} · ${header.unit} → Tham mưu trưởng`,
    `NHIỆM VỤ  : ${report.mission}`,
    `GIAO BỞI  : ${header.assignedBy} · MODEL: ${header.model ?? '?'}`,
    `YÊU CẦU   : ${header.expected || '—'}`,
    `CÁCH THỬ  : ${header.verification || '—'}`,
    `KẾT QUẢ   : ${report.result}`,
    `BẰNG CHỨNG: ${report.evidence || '—'}`,
    `VƯỚNG     : ${report.obstacles}`,
  ];
  if (report.questions.length > 0) lines.push(`CÂU HỎI   : ${report.questions.map((item, index) => `(${index + 1}) ${item}`).join(' ')}`);
  lines.push(`ĐỀ XUẤT   : ${report.proposal || '—'}`);
  if (report.howToRun !== 'Không') lines.push(`CÁCH CHẠY : ${report.howToRun}`);
  return lines.join('\n');
}

/**
 * Cộng dồn thiệt hại của nhiều lần chạy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function sumDamage(runs: RunRecord[]): DamageTotals {
  return runs.reduce<DamageTotals>(
    (total, run) => ({
      runs: total.runs + 1,
      failures: total.failures + (run.ok ? 0 : 1),
      denials: total.denials + run.denials,
      durationMs: total.durationMs + run.durationMs,
      inputTokens: total.inputTokens + run.usage.inputTokens + run.usage.cacheCreationTokens + run.usage.cacheReadTokens,
      outputTokens: total.outputTokens + run.usage.outputTokens,
      costUsd: total.costUsd + run.costUsd,
      fiveHourDelta: total.fiveHourDelta + (run.fiveHourDelta ?? 0),
      sevenDayDelta: total.sevenDayDelta + (run.sevenDayDelta ?? 0),
    }),
    { runs: 0, failures: 0, denials: 0, durationMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, fiveHourDelta: 0, sevenDayDelta: 0 },
  );
}

/**
 * Báo cáo thiệt hại chuẩn quân đội (Ban Hậu cần lập).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatDamage(title: string, damage: DamageTotals): string {
  return [
    `THIỆT HẠI · ${title}`,
    `LƯỢT CHẠY : ${damage.runs} · lỗi ${damage.failures} · lệnh bị chặn ${damage.denials}`,
    `THỜI GIAN : ${formatDuration(damage.durationMs)}`,
    `QUOTA     : 5h ${formatDelta(damage.fiveHourDelta)} · 7d ${formatDelta(damage.sevenDayDelta)}`,
    `TOKEN     : vào ${formatTokens(damage.inputTokens)} · ra ${formatTokens(damage.outputTokens)}`,
    `QUY ĐỔI   : ≈ $${damage.costUsd.toFixed(2)} (giá API tham khảo, gói đăng ký không bị trừ tiền)`,
  ].join('\n');
}

/**
 * "mm:ss" hoặc "h:mm:ss".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.round(milliseconds / MS_PER_SECOND);
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}` : `${pad(minutes)}:${pad(seconds % 60)}`;
}

/**
 * Chênh lệch quota dạng "+3%".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatDelta(delta: number): string {
  const percent = Math.round(delta * PERCENT);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
}

/**
 * Số token dạng "182k".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatTokens(tokens: number): string {
  return tokens >= TOKENS_PER_K ? `${Math.round(tokens / TOKENS_PER_K)}k` : String(tokens);
}
