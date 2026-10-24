import { formatClock } from '@/lib/labels';
import type { QuotaWindow } from '@/lib/types';

const PERCENT = 100;
const HOT_PERCENT = 90;
const MS_PER_SECOND = 1000;
const BAR_CELLS = 10;

type MiniMeterProps = { label: string; window: QuotaWindow | null };

/**
 * Thanh quota kiểu terminal `5h [▮▮▮▯▯] 42%`, rê chuột để xem giờ reset.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function MiniMeter({ label, window }: MiniMeterProps) {
  const percent = window ? Math.round(window.utilization * PERCENT) : null;
  const filled = percent === null ? 0 : Math.round((percent / PERCENT) * BAR_CELLS);
  return (
    <span
      className={`mini-meter ${percent !== null && percent >= HOT_PERCENT ? 'is-hot' : ''}`}
      title={window ? `Reset lúc ${formatClock(window.resetsAt * MS_PER_SECOND)}` : 'Chưa có dữ liệu quota'}
    >
      <span className="muted">{label}</span>
      <span className="cells" aria-hidden>
        {Array.from({ length: BAR_CELLS }, (_, index) => (
          <i key={index} className={index < filled ? 'cell is-filled' : 'cell'} />
        ))}
      </span>
      <span>{percent === null ? '--' : `${percent}%`}</span>
    </span>
  );
}
