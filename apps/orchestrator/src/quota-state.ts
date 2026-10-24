import { log } from './logger.ts';
import { DEFAULT_PROVIDER } from './providers.ts';
import { pauseUntilFor, type QuotaThresholds } from './quota.ts';
import type { FactoryStore } from './store.ts';
import type { QuotaSnapshot } from './types.ts';

const QUOTAS_KEY = 'quota_by_provider';
const PAUSES_KEY = 'paused_until_by_provider';
const PAUSED_MANUAL_KEY = 'paused_manual';
const MS_PER_MINUTE = 60_000;

export type PauseState = {
  manual: boolean;
  until: number | null;
};

/**
 * Trạng thái quota + tạm dừng theo từng nguồn (mỗi tài khoản một quota riêng), lưu
 * trong DB để sống qua lần khởi động lại. Hàng đợi chỉ nghỉ khi mọi nguồn đang dùng đều nghỉ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class QuotaState {
  readonly store: FactoryStore;
  readonly thresholds: QuotaThresholds;
  private sources: () => string[] = () => [DEFAULT_PROVIDER];

  /**
   * Khởi tạo với store và ngưỡng tạm dừng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(store: FactoryStore, thresholds: QuotaThresholds) {
    this.store = store;
    this.thresholds = thresholds;
  }

  /**
   * Khai báo các nguồn đang được dùng (gói chính, nguồn đã gán, nguồn dự phòng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  setSources(sources: () => string[]): void {
    this.sources = sources;
  }

  /**
   * Snapshot quota mới nhất của mọi nguồn.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  snapshots(): Record<string, QuotaSnapshot> {
    return this.store.getSetting<Record<string, QuotaSnapshot>>(QUOTAS_KEY, {});
  }

  /**
   * Snapshot quota của một nguồn; không truyền nguồn thì lấy snapshot cập nhật gần nhất.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  snapshot(provider?: string): QuotaSnapshot | null {
    const all = this.snapshots();
    if (provider) return all[provider] ?? null;
    const latest = Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
    return latest[0] ?? null;
  }

  /**
   * Ghi snapshot mới cho nguồn của nó; vượt ngưỡng thì cho nguồn đó nghỉ tới lúc reset.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  update(quota: QuotaSnapshot, now: number = Date.now()): void {
    const provider = quota.provider ?? DEFAULT_PROVIDER;
    this.store.setSetting(QUOTAS_KEY, { ...this.snapshots(), [provider]: { ...quota, provider } });
    const until = pauseUntilFor(quota, this.thresholds, now);
    if (until) this.pauseUntil(provider, until);
  }

  /**
   * Cho một nguồn nghỉ tới thời điểm [until] (ms); giữ mốc muộn hơn nếu đã có.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  pauseUntil(provider: string, until: number): void {
    const pauses = this.pauses();
    const current = pauses[provider];
    if (current && current >= until) return;
    this.store.setSetting(PAUSES_KEY, { ...pauses, [provider]: until });
    log.warn({ provider, until: new Date(until).toISOString() }, '[QuotaState] nguồn tạm nghỉ vì quota');
  }

  /**
   * Nguồn vừa báo hết quota mà không rõ giờ reset: nghỉ theo thời gian dự phòng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  markUsageLimit(provider: string, now: number = Date.now()): void {
    this.pauseUntil(provider, now + this.thresholds.fallbackPauseMinutes * MS_PER_MINUTE);
  }

  /**
   * Giờ (ms) nguồn hoạt động lại; null nếu nguồn đang chạy được.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  pausedUntil(provider: string, now: number = Date.now()): number | null {
    const until = this.pauses()[provider] ?? 0;
    return until > now ? until : null;
  }

  /**
   * Nguồn có đang nghỉ vì quota không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  isSourcePaused(provider: string, now: number = Date.now()): boolean {
    return (this.pauses()[provider] ?? 0) > now;
  }

  /**
   * Bật/tắt tạm dừng tay; tiếp tục thì xoá luôn giờ nghỉ do quota của mọi nguồn.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  setManualPause(paused: boolean): void {
    this.store.setSetting(PAUSED_MANUAL_KEY, paused);
    if (!paused) this.store.setSetting(PAUSES_KEY, {});
  }

  /**
   * Trạng thái tạm dừng của hàng đợi: chỉ có giờ nghỉ khi mọi nguồn đang dùng đều nghỉ,
   * khi đó là lúc nguồn sớm nhất hoạt động lại.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  pauseState(now: number = Date.now()): PauseState {
    const pauses = this.pauses();
    const untils = [...new Set(this.sources())].map((provider) => pauses[provider] ?? 0);
    const allPaused = untils.length > 0 && untils.every((until) => until > now);
    return {
      manual: this.store.getSetting<boolean>(PAUSED_MANUAL_KEY, false),
      until: allPaused ? Math.min(...untils) : null,
    };
  }

  /**
   * Hàng đợi có đang phải nghỉ không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  isPaused(now: number = Date.now()): boolean {
    const state = this.pauseState(now);
    return state.manual || state.until !== null;
  }

  /**
   * Bảng giờ nghỉ (ms) theo nguồn.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private pauses(): Record<string, number> {
    return this.store.getSetting<Record<string, number>>(PAUSES_KEY, {});
  }
}
