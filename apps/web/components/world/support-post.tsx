import type { LucideIcon } from 'lucide-react';

import { iso, type GridPoint } from '@/lib/iso';

import { IsoBox } from './iso-box';

const SIZE = { width: 0.95, depth: 0.95, height: 0.32 };
const ICON_SIZE = 18;
const LABEL_GAP = 16;

type SupportPostProps = {
  center: GridPoint;
  icon: LucideIcon;
  label: string;
  status: string;
  isAlert: boolean;
  onOpen: () => void;
};

/**
 * Trạm của Khối Bảo đảm (Ban Hậu cần, Ban Bảo mật — máy tự chạy, không tốn quota):
 * khối nhỏ có icon, nhãn và một dòng trạng thái; có cảnh báo thì chuyển màu.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function SupportPost({ center, icon: Icon, label, status, isAlert, onOpen }: SupportPostProps) {
  const top = iso({ ...center, z: SIZE.height + 0.35 });
  return (
    <g
      className={`world-object support ${isAlert ? 'is-blocked' : 'is-idle'}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={`${label} — ${status}`}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen()}
    >
      <IsoBox center={center} {...SIZE} className="platform support-body" />
      <Icon className="support-icon" x={top.x - ICON_SIZE / 2} y={top.y - ICON_SIZE / 2} width={ICON_SIZE} height={ICON_SIZE} strokeWidth={1.6} />
      <title>{`${label} — ${status}`}</title>
      <text className="world-label" x={top.x} y={top.y - LABEL_GAP} textAnchor="middle">{label}</text>
      <text className="world-sublabel" x={top.x} y={top.y + LABEL_GAP + 14} textAnchor="middle">{status}</text>
    </g>
  );
}
