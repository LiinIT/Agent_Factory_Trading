'use client';

import { Pause, Play } from 'lucide-react';

import { formatClock } from '@/lib/labels';
import type { FactoryState } from '@/lib/types';

import { MiniMeter } from '../shell/mini-meter';

const MS_PER_SECOND = 1000;

type QuotaScreenProps = {
  state: FactoryState;
  onTogglePause: () => void;
};

/**
 * Màn hình phụ Quota & hàng đợi: % quota, giờ reset, số task theo trạng thái, tạm dừng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function QuotaScreen({ state, onTogglePause }: QuotaScreenProps) {
  const { quota, pause, tasks } = state;
  const count = (status: string) => tasks.filter((task) => task.status === status).length;
  const rows: [string, string][] = [
    ['trạng thái quota', quota?.status ?? 'chưa có dữ liệu'],
    ['reset 5h', quota?.fiveHour ? formatClock(quota.fiveHour.resetsAt * MS_PER_SECOND) : '--'],
    ['reset 7d', quota?.sevenDay ? formatClock(quota.sevenDay.resetsAt * MS_PER_SECOND) : '--'],
    ['nghỉ vì quota tới', pause.until ? formatClock(pause.until) : 'không'],
    ['task đang chạy / chờ', `${count('running')} / ${count('queued')}`],
    ['chờ duyệt / lỗi', `${count('awaiting_approval')} / ${count('failed')}`],
  ];
  return (
    <div className="quota-screen">
      <div className="quota-meters">
        <MiniMeter label="5h" window={quota?.fiveHour ?? null} />
        <MiniMeter label="7d" window={quota?.sevenDay ?? null} />
      </div>
      <dl className="kv">
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button className="button" onClick={onTogglePause}>
        {pause.manual ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
        {pause.manual ? 'Tiếp tục hàng đợi' : 'Tạm dừng hàng đợi'}
      </button>
    </div>
  );
}
