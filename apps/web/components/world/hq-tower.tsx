import { Brain } from 'lucide-react';

import { iso, type GridPoint } from '@/lib/iso';

import { IsoBox } from './iso-box';

const BRAIN_SIZE = 46;
const RADAR_RX = 30;
const RADAR_RY = 12;

type HqTowerProps = {
  center: GridPoint;
  isThinking: boolean;
  queued: number;
  onOpen: () => void;
};

/**
 * Sở chỉ huy: tháp nhiều tầng, khối kính chứa Brain (Tham mưu trưởng) trên đỉnh,
 * radar quay khi đang xử lý; dưới chân là trạm Ban Thông tin (hàng đợi).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function HqTower({ center, isThinking, queued, onOpen }: HqTowerProps) {
  const core = iso({ ...center, z: 3.25 });
  const radar = iso({ ...center, z: 4.25 });
  const label = iso({ ...center, z: 4.9 });
  return (
    <g
      className={`world-object hq ${isThinking ? 'is-working' : 'is-idle'}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label="Sở chỉ huy — liên lạc Tham mưu trưởng"
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen()}
    >
      <title>Sở chỉ huy — Tham mưu trưởng: nhận báo cáo, giao nhiệm vụ, báo cáo Thủ trưởng</title>
      <IsoBox center={center} width={3} depth={3} height={0.3} className="platform platform-core" />
      <IsoBox center={{ ...center, z: 0.3 }} width={1.9} depth={1.9} height={0.9} className="bld-body" />
      <IsoBox center={{ ...center, z: 1.2 }} width={1.35} depth={1.35} height={1.1} className="bld-body" />
      <IsoBox center={{ ...center, z: 2.3 }} width={1.4} depth={1.4} height={1.6} className="glass" />
      <ellipse className="core-glow" cx={core.x} cy={core.y} rx={46} ry={36} />
      <Brain className="core-icon" x={core.x - BRAIN_SIZE / 2} y={core.y - BRAIN_SIZE / 2} width={BRAIN_SIZE} height={BRAIN_SIZE} strokeWidth={1.2} />
      <g className="radar" style={{ transformOrigin: `${radar.x}px ${radar.y}px` }}>
        <ellipse className="radar-dish" cx={radar.x} cy={radar.y} rx={RADAR_RX} ry={RADAR_RY} />
        <line className="radar-sweep" x1={radar.x} y1={radar.y} x2={radar.x + RADAR_RX} y2={radar.y} />
      </g>
      <text className="world-label" x={label.x} y={label.y} textAnchor="middle">so-chi-huy · tham-muu-truong</text>
      <text className="world-sublabel" x={label.x} y={label.y + 14} textAnchor="middle">
        {isThinking ? '> đang xử lý báo cáo…' : `> sẵn sàng · hàng đợi ${queued}`}
      </text>
    </g>
  );
}
