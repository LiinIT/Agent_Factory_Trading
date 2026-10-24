import { log } from './logger.ts';
import { DEFAULT_PROVIDER } from './providers.ts';
import { formatDamage, formatDelta, formatDuration, formatTokens, sumDamage } from './report.ts';
import type { FactoryStore } from './store.ts';
import type { DamageTotals, QuotaSnapshot, QuotaWindow, RunRecord, RunResult } from './types.ts';

const SUMMARY_KEY_PREFIX = 'damage_summary_at:';
const DAY_LENGTH = 10;

export type RunStart = {
  startedAt: string;
  baseline: Record<string, QuotaSnapshot>;
  latest: Record<string, QuotaSnapshot>;
};

export type RunOwner = {
  taskId: number | null;
  projectId: string | null;
  role: string;
  provider?: string | null;
};

export type DamageReport = {
  today: DamageTotals;
  byTask: Record<number, DamageTotals>;
  byProject: Record<string, DamageTotals>;
  byDay: Record<string, DamageTotals>;
  byRole: Record<string, DamageTotals>;
};

/**
 * Ban Hậu cần (máy tự chạy, không tốn quota): ghi mọi lần chạy agent, tính thiệt
 * hại (thời gian, token, quota, quy đổi USD), báo động khi một task ăn quá ngưỡng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class Logistics {
  readonly store: FactoryStore;
  readonly alarmFiveHourDelta: number;

  /**
   * Khởi tạo với store và ngưỡng báo động (tỉ lệ quota 5h / task).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(store: FactoryStore, alarmFiveHourDelta: number) {
    this.store = store;
    this.alarmFiveHourDelta = alarmFiveHourDelta;
  }

  /**
   * Mở sổ cho một lượt chạy. Mốc quota không lấy từ số đã lưu (có thể cũ hàng giờ và lẫn
   * phần tài khoản bị dùng ở nơi khác) mà lấy từ sự kiện quota đầu tiên trong chính lượt chạy.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  startRun(): RunStart {
    return { startedAt: new Date().toISOString(), baseline: {}, latest: {} };
  }

  /**
   * Ghi một sự kiện quota của lượt chạy: sự kiện đầu tiên của mỗi nguồn làm mốc, sự kiện sau cập nhật mức mới nhất.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  observeQuota(start: RunStart, quota: QuotaSnapshot): void {
    const provider = quota.provider ?? DEFAULT_PROVIDER;
    start.baseline[provider] ??= quota;
    start.latest[provider] = quota;
  }

  /**
   * Quota 5h của nguồn đang chạy đã tăng quá ngưỡng kể từ sự kiện quota đầu tiên của lượt chạy chưa.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  exceedsAlarm(start: RunStart, latest: QuotaSnapshot): boolean {
    this.observeQuota(start, latest);
    const delta = windowDelta(quotaBefore(start, latest.provider)?.fiveHour ?? null, latest.fiveHour);
    return delta !== null && delta >= this.alarmFiveHourDelta;
  }

  /**
   * Ghi một lần chạy với chênh lệch quota trước/sau.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  recordRun(owner: RunOwner, start: RunStart, result: RunResult): RunRecord {
    if (result.quota) this.observeQuota(start, result.quota);
    const provider = result.quota?.provider ?? result.provider;
    const after = start.latest[provider ?? DEFAULT_PROVIDER] ?? null;
    const before = quotaBefore(start, provider);
    const run = this.store.insertRun({
      ...owner,
      model: result.model,
      ok: result.ok,
      startedAt: start.startedAt,
      durationMs: result.durationMs || Date.now() - Date.parse(start.startedAt),
      usage: result.usage,
      costUsd: result.costUsd,
      fiveHourDelta: windowDelta(before?.fiveHour ?? null, after?.fiveHour ?? null),
      sevenDayDelta: windowDelta(before?.sevenDay ?? null, after?.sevenDay ?? null),
      denials: result.permissionDenials.length,
      provider: owner.provider ?? result.provider ?? null,
    });
    log.info({ runId: run.id, taskId: owner.taskId, costUsd: run.costUsd }, '[Logistics] ghi lần chạy');
    return run;
  }

  /**
   * Một dòng thiệt hại ngắn của một lần chạy.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  runLine(run: RunRecord): string {
    const input = run.usage.inputTokens + run.usage.cacheCreationTokens + run.usage.cacheReadTokens;
    return [
      `THIỆT HẠI #${run.taskId ?? '-'} · ${run.role}`,
      `THỜI GIAN ${formatDuration(run.durationMs)}`,
      `QUOTA 5h ${formatDelta(run.fiveHourDelta ?? 0)} · 7d ${formatDelta(run.sevenDayDelta ?? 0)}`,
      `TOKEN vào ${formatTokens(input)} / ra ${formatTokens(run.usage.outputTokens)}`,
      `≈ $${run.costUsd.toFixed(2)}`,
      run.ok ? 'chạy ĐẠT' : 'chạy LỖI',
      run.denials > 0 ? `${run.denials} lệnh bị chặn` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  /**
   * Báo cáo tổng thiệt hại của project từ lần tổng kết trước tới giờ (rồi đặt lại mốc).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  summarizeProject(projectId: string, phase: string): string | null {
    const key = `${SUMMARY_KEY_PREFIX}${projectId}`;
    const since = this.store.getSetting<string | undefined>(key, undefined);
    const runs = this.store.listRuns({ projectId, since });
    this.store.setSetting(key, new Date().toISOString());
    if (runs.length === 0) return null;
    return formatDamage(`TỔNG · ${projectId} · ${phase}`, sumDamage(runs));
  }

  /**
   * Thiệt hại theo hôm nay / task / project / ngày / ban.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  report(now: Date = new Date()): DamageReport {
    const runs = this.store.listRuns();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    return {
      today: sumDamage(runs.filter((run) => Date.parse(run.startedAt) >= midnight.getTime())),
      byTask: groupDamage(runs.filter((run) => run.taskId !== null), (run) => String(run.taskId)),
      byProject: groupDamage(runs.filter((run) => run.projectId !== null), (run) => String(run.projectId)),
      byDay: groupDamage(runs, (run) => run.startedAt.slice(0, DAY_LENGTH)),
      byRole: groupDamage(runs, (run) => run.role),
    };
  }
}

/**
 * Mốc quota (sự kiện đầu tiên trong lượt chạy) của đúng nguồn đã chạy (không có tên nguồn → gói chính).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function quotaBefore(start: RunStart, provider: string | undefined): QuotaSnapshot | null {
  return start.baseline[provider ?? DEFAULT_PROVIDER] ?? null;
}

/**
 * Chênh lệch % của một khung quota; khung đã reset giữa chừng thì lấy mức sau.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function windowDelta(before: QuotaWindow | null, after: QuotaWindow | null): number | null {
  if (!after) return null;
  if (!before) return null;
  if (after.resetsAt !== before.resetsAt) return after.utilization;
  return Math.max(0, after.utilization - before.utilization);
}

/**
 * Gom thiệt hại theo khoá.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function groupDamage(runs: RunRecord[], keyOf: (run: RunRecord) => string): Record<string, DamageTotals> {
  const groups = new Map<string, RunRecord[]>();
  for (const run of runs) groups.set(keyOf(run), [...(groups.get(keyOf(run)) ?? []), run]);
  return Object.fromEntries([...groups].map(([key, items]) => [key, sumDamage(items)]));
}
