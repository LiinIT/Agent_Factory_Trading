import type { QuotaSnapshot, QuotaWindow } from './types.ts';

export type QuotaThresholds = {
  pauseAtFiveHourUtilization: number;
  pauseAtSevenDayUtilization: number;
  fallbackPauseMinutes: number;
};

const USAGE_LIMIT_TEXT = /usage limit|rate limit|hit your (?:[a-z0-9-]+ )?limit|limit reached|quota/i;
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60_000;

/**
 * Đổi `rate_limit_info` của Claude Code thành snapshot quota gọn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function quotaFromRateLimitInfo(info: unknown, now: number): QuotaSnapshot | null {
  if (!info || typeof info !== 'object') return null;
  const data = info as Record<string, unknown>;
  const windows = (data.unifiedWindows ?? {}) as Record<string, unknown>;
  return {
    status: typeof data.status === 'string' ? data.status : 'unknown',
    fiveHour: toWindow(windows.five_hour),
    sevenDay: toWindow(windows.seven_day),
    updatedAt: now,
  };
}

/**
 * Đọc một khung quota `{utilization, resetsAt}`; sai định dạng thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toWindow(value: unknown): QuotaWindow | null {
  if (!value || typeof value !== 'object') return null;
  const { utilization, resetsAt } = value as Record<string, unknown>;
  if (typeof utilization !== 'number' || typeof resetsAt !== 'number') return null;
  return { utilization, resetsAt };
}

/**
 * Thời điểm (ms) hàng đợi phải nghỉ tới; null nếu còn chạy được.
 * Hết quota thật (`rejected`) hoặc vượt ngưỡng cấu hình đều dừng tới giờ reset.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function pauseUntilFor(
  quota: QuotaSnapshot,
  thresholds: QuotaThresholds,
  now: number,
): number | null {
  const candidates: number[] = [];
  const { fiveHour, sevenDay } = quota;
  if (fiveHour && fiveHour.utilization >= thresholds.pauseAtFiveHourUtilization) {
    candidates.push(fiveHour.resetsAt * MS_PER_SECOND);
  }
  if (sevenDay && sevenDay.utilization >= thresholds.pauseAtSevenDayUtilization) {
    candidates.push(sevenDay.resetsAt * MS_PER_SECOND);
  }
  if (quota.status === 'rejected' && candidates.length === 0) {
    candidates.push(now + thresholds.fallbackPauseMinutes * MS_PER_MINUTE);
  }
  const future = candidates.filter((time) => time > now);
  return future.length > 0 ? Math.max(...future) : null;
}

/**
 * Câu lỗi của Claude có phải do hết quota / bị giới hạn tốc độ không.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function isUsageLimitText(text: string): boolean {
  return USAGE_LIMIT_TEXT.test(text);
}
