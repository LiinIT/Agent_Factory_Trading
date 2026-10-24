import type { AccountInfo } from '@/lib/types';

const TIME_ZONE = 'Asia/Saigon';
const PERCENT = 100;

/**
 * Giờ Việt Nam dạng "02:00 19/10".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function shortTime(ms: number): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false }).format(ms);
}

/**
 * Tỉ lệ 0..1 thành "63%"; chưa có số thì "?".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function percent(value: number | null): string {
  return value === null ? '?' : `${Math.round(value * PERCENT)}%`;
}

/**
 * Trạng thái một tài khoản: chưa có token / hết hạn mức tới giờ nào / sẵn sàng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function stateOf(account: AccountInfo): { text: string; tone: 'ok' | 'warn' | 'muted' } {
  if (!account.hasLogin) return { text: 'chưa có token', tone: 'muted' };
  if (account.pausedUntil) return { text: `hết hạn mức tới ${shortTime(account.pausedUntil)}`, tone: 'warn' };
  return { text: 'sẵn sàng', tone: 'ok' };
}

/**
 * Một dòng tài khoản Claude trong thẻ đổi tài khoản: tên, vai (ưu tiên/dự phòng), trạng thái, quota.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function AccountRow({ account }: { account: AccountInfo }) {
  const state = stateOf(account);
  const roles = [account.isPreferred ? 'ưu tiên' : '', account.isFallback ? 'dự phòng' : ''].filter(Boolean).join(' · ');
  return (
    <li className="account-row">
      <span className="account-name">
        {account.label}
        {roles ? <span className="muted"> · {roles}</span> : null}
      </span>
      <span className={`account-state account-state-${state.tone}`}>{state.text}</span>
      {account.hasLogin ? (
        <span className="muted">
          5 giờ {percent(account.fiveHour)} · 7 ngày {percent(account.sevenDay)}
        </span>
      ) : null}
    </li>
  );
}
