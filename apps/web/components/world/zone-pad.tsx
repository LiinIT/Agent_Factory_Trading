import type { GridPoint } from '@/lib/iso';

import { IsoBox } from './iso-box';

type ZonePadProps = {
  center: GridPoint;
  size: number;
  isActive: boolean;
};

/**
 * Nền vuông dưới mỗi công trình (viền nét đứt, sáng lên khi ban đang làm).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ZonePad({ center, size, isActive }: ZonePadProps) {
  return (
    <g className={`zone ${isActive ? 'is-active' : ''}`}>
      <IsoBox center={{ ...center, z: -0.04 }} width={size} depth={size} height={0.06} className="zone-pad" />
    </g>
  );
}
