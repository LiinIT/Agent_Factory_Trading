import type { FactoryBus } from './bus.ts';
import { log } from './logger.ts';
import type { Manager } from './manager.ts';
import { MANAGER_ROLE } from './manager-actions.ts';
import { DEFAULT_PROVIDER, providerById, type ProviderRouter } from './providers.ts';
import type { QuotaState } from './quota-state.ts';
import type { SecretStore } from './secrets.ts';

export const ALT_ACCOUNT = 'claude-alt';
const ACCOUNTS = [DEFAULT_PROVIDER, ALT_ACCOUNT];
export const ALT_SECRET = 'CLAUDE_CODE_OAUTH_TOKEN';
const TIME_ZONE = 'Asia/Saigon';
const PERCENT = 100;
const MAX_COMMAND_WORDS = 6;
const NO_ACCOUNT_LEFT = '- !!Không còn tài khoản nào chạy được — chờ reset hoặc nạp token tài khoản phụ.!!';
const REPORT_TAG = '[ BÁO CÁO ]';

export type AccountCommand = 'status' | 'use-alt' | 'use-main';

export type AccountInfo = {
  id: string;
  label: string;
  hasLogin: boolean;
  isPreferred: boolean;
  isFallback: boolean;
  pausedUntil: number | null;
  fiveHour: number | null;
  sevenDay: number | null;
};

export type AccountStatus = {
  accounts: AccountInfo[];
  next: string | null;
  pendingRetry: boolean;
};

export type AccountDeskDeps = {
  router: ProviderRouter;
  quota: QuotaState;
  secrets: SecretStore;
  manager: Manager;
  bus: FactoryBus;
  tickScheduler: () => void;
};

/**
 * Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng — để so lệnh máy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

/**
 * Nhận lệnh máy về tài khoản trong chat (0 token); câu khác trả null để chuyển Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseAccountCommand(text: string): AccountCommand | null {
  const said = plain(text);
  if (!said || said.split(' ').length > MAX_COMMAND_WORDS) return null;
  if (/^(tinh hinh|trang thai|kiem tra|bao cao)( cac)? tai khoan$|^tai khoan$/.test(said)) return 'status';
  if (/^(chuyen|doi|dung)( sang| qua)? tai khoan phu$/.test(said)) return 'use-alt';
  if (/^(chuyen|doi|dung|quay)( lai| sang| ve| qua)? tai khoan chinh$/.test(said)) return 'use-main';
  return null;
}

/**
 * Giờ Việt Nam dạng ngắn "02:00 19/10".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function shortTime(ms: number): string {
  const parts = new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false }).formatToParts(ms);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('hour')}:${part('minute')} ${part('day')}/${part('month')}`;
}

/**
 * Ban Thông tin quản lý tài khoản Claude: báo tình hình từng tài khoản, chuyển tài khoản
 * ưu tiên (tài khoản kia làm dự phòng), rồi gửi lại tin bị lỗi vì hết quota.
 * Máy tự chạy, không tốn quota. Token chỉ đi qua Keychain, không bao giờ vào chat.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export class AccountDesk {
  readonly deps: AccountDeskDeps;

  /**
   * Khởi tạo với router, quota, kho khoá, Tham mưu trưởng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  constructor(deps: AccountDeskDeps) {
    this.deps = deps;
  }

  /**
   * Tình hình các tài khoản Claude và tài khoản sẽ chạy lượt kế tiếp.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async status(): Promise<AccountStatus> {
    const { router, quota, manager } = this.deps;
    const hasAltToken = await this.hasAltToken();
    const accounts = ACCOUNTS.map((id) => {
      const snapshot = quota.snapshot(id);
      return {
        id,
        label: providerById(id)?.label ?? id,
        hasLogin: id === DEFAULT_PROVIDER || hasAltToken,
        isPreferred: router.preferred() === id,
        isFallback: router.fallback() === id,
        pausedUntil: quota.pausedUntil(id),
        fiveHour: snapshot?.fiveHour?.utilization ?? null,
        sevenDay: snapshot?.sevenDay?.utilization ?? null,
      };
    });
    const runnable = router.chain(MANAGER_ROLE).find((item) => !quota.isSourcePaused(item.provider));
    return { accounts, next: runnable ? (providerById(runnable.provider)?.label ?? runnable.provider) : null, pendingRetry: manager.hasPendingRetry() };
  }

  /**
   * Chuyển tài khoản ưu tiên sang [target], tài khoản còn lại làm dự phòng (nếu dùng được),
   * cho hàng đợi chạy tiếp và gửi lại tin bị lỗi vì hết quota.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async use(target: string): Promise<AccountStatus> {
    if (!ACCOUNTS.includes(target)) throw new Error(`Không có tài khoản ${target}`);
    const hasAltToken = await this.hasAltToken();
    if (target === ALT_ACCOUNT && !hasAltToken) throw new Error('Tài khoản phụ chưa có token — dán token vào ô trong thẻ đổi tài khoản.');
    const other = target === ALT_ACCOUNT ? DEFAULT_PROVIDER : ALT_ACCOUNT;
    const { router, bus, manager } = this.deps;
    router.setPreferred(target);
    router.setFallback(other === ALT_ACCOUNT && !hasAltToken ? null : other);
    log.info({ target, fallback: router.fallback() }, '[AccountDesk] chuyển tài khoản');
    bus.publish({ type: 'state' });
    this.deps.tickScheduler();
    manager.retryPending();
    return this.status();
  }

  /**
   * Thực hiện lệnh máy trong chat, trả câu trả lời của Ban Thông tin.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async runCommand(command: AccountCommand): Promise<string> {
    if (command === 'status') return describeStatus(await this.status());
    const target = command === 'use-alt' ? ALT_ACCOUNT : DEFAULT_PROVIDER;
    const wasPending = this.deps.manager.hasPendingRetry();
    const status = await this.use(target);
    const resent = wasPending ? ['- Đã gửi lại lệnh trước đó cho Tham mưu trưởng.'] : [];
    return [`${REPORT_TAG} Đã chuyển sang **${providerById(target)?.label ?? target}**.`, ...resent, ...statusLines(status)].join('\n');
  }

  /**
   * Tài khoản phụ đã có token trong Keychain chưa (không đọc ra ngoài).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private async hasAltToken(): Promise<boolean> {
    return (await this.deps.secrets.get(ALT_SECRET)) !== null;
  }
}

/**
 * Báo cáo tình hình tài khoản cho chat theo mẫu `[ BÁO CÁO ]` + từng ý một dòng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function describeStatus(status: AccountStatus): string {
  return [`${REPORT_TAG} Tình hình tài khoản Claude.`, ...statusLines(status)].join('\n');
}

/**
 * Các ý: mỗi tài khoản một dòng (tên nhấn màu, hết hạn mức tô cảnh báo) + tài khoản chạy lượt kế.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function statusLines(status: AccountStatus): string[] {
  const lines = status.accounts.map((account) => {
    const roles = [account.isPreferred ? 'ưu tiên' : '', account.isFallback ? 'dự phòng' : ''].filter(Boolean).join(', ');
    const usage = [account.fiveHour, account.sevenDay].every((value) => value === null)
      ? 'chưa có số liệu quota'
      : `5 giờ ${formatPercent(account.fiveHour)} · 7 ngày ${formatPercent(account.sevenDay)}`;
    return `- **${account.label}**${roles ? ` (${roles})` : ''}: ${describeState(account)} · ${usage}`;
  });
  const next = status.next ? `- Lượt kế tiếp chạy bằng: **${status.next}**.` : NO_ACCOUNT_LEFT;
  return [...lines, next];
}

/**
 * Trạng thái một tài khoản: chưa có token / hết hạn mức tới giờ nào / sẵn sàng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function describeState(account: AccountInfo): string {
  if (!account.hasLogin) return '!!chưa có token!!';
  if (account.pausedUntil) return `!!hết hạn mức tới ${shortTime(account.pausedUntil)}!!`;
  return 'sẵn sàng';
}

/**
 * Tỉ lệ 0..1 thành "63%"; không có số thì "?".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function formatPercent(value: number | null): string {
  return value === null ? '?' : `${Math.round(value * PERCENT)}%`;
}
