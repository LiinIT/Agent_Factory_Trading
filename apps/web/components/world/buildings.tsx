import { iso, polygonPoints, type GridPoint } from '@/lib/iso';

import { IsoBox } from './iso-box';

type BuildingProps = { center: GridPoint };

/**
 * Đỉnh lều/mái nhọn: 4 mặt tam giác từ đáy vuông lên một đỉnh.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function Pyramid({ center, half, base, height }: { center: GridPoint; half: number; base: number; height: number }) {
  const apex = { x: center.x, y: center.y, z: base + height };
  const corner = (dx: number, dy: number) => ({ x: center.x + dx * half, y: center.y + dy * half, z: base });
  return (
    <g className="bld-roof">
      <polygon className="face-left" points={polygonPoints([corner(-1, 1), corner(1, 1), apex])} />
      <polygon className="face-right" points={polygonPoints([corner(1, -1), corner(1, 1), apex])} />
    </g>
  );
}

/**
 * Ban Tác chiến — lều chỉ huy: đế + lều mái nhọn + cột cờ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function CommandTent({ center }: BuildingProps) {
  const poleBase = iso({ x: center.x + 0.55, y: center.y - 0.55, z: 0.2 });
  const poleTop = iso({ x: center.x + 0.55, y: center.y - 0.55, z: 1.9 });
  return (
    <g className="building">
      <IsoBox center={center} width={1.5} depth={1.5} height={0.2} className="bld-base" />
      <IsoBox center={{ ...center, z: 0.2 }} width={1.1} depth={1.1} height={0.45} className="bld-body" />
      <Pyramid center={center} half={0.62} base={0.65} height={0.75} />
      <line className="bld-line" x1={poleBase.x} y1={poleBase.y} x2={poleTop.x} y2={poleTop.y} />
      <polygon className="bld-flag" points={`${poleTop.x},${poleTop.y} ${poleTop.x + 16},${poleTop.y + 5} ${poleTop.x},${poleTop.y + 10}`} />
    </g>
  );
}

/**
 * Ban Ngoại giao — tấm "bộ mặt" lớn đứng trên bệ (giống bảng trình chiếu).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function FacadeBoard({ center }: BuildingProps) {
  const face = (offset: number) =>
    polygonPoints([
      { x: center.x + offset, y: center.y - 0.6, z: 1.9 },
      { x: center.x + offset, y: center.y + 0.6, z: 1.9 },
      { x: center.x + offset, y: center.y + 0.6, z: 0.35 },
      { x: center.x + offset, y: center.y - 0.6, z: 0.35 },
    ]);
  return (
    <g className="building">
      <IsoBox center={center} width={1.5} depth={1.5} height={0.22} className="bld-base" />
      <polygon className="bld-panel-back" points={face(-0.08)} />
      <polygon className="bld-panel" points={face(0)} />
    </g>
  );
}

/**
 * Ban Công binh — cần cẩu: thân cột, cần ngang, dây móc, khối vật liệu.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function Crane({ center }: BuildingProps) {
  const mastTop = iso({ x: center.x - 0.3, y: center.y - 0.3, z: 2.3 });
  const boomEnd = iso({ x: center.x + 0.9, y: center.y - 0.3, z: 2.3 });
  const hook = iso({ x: center.x + 0.9, y: center.y - 0.3, z: 1.0 });
  return (
    <g className="building">
      <IsoBox center={center} width={1.5} depth={1.5} height={0.2} className="bld-base" />
      <IsoBox center={{ x: center.x - 0.3, y: center.y - 0.3, z: 0.2 }} width={0.28} depth={0.28} height={2.1} className="bld-body" />
      <line className="bld-line is-thick" x1={mastTop.x} y1={mastTop.y} x2={boomEnd.x} y2={boomEnd.y} />
      <line className="bld-line crane-cable" x1={boomEnd.x} y1={boomEnd.y} x2={hook.x} y2={hook.y} />
      <IsoBox center={{ x: center.x + 0.35, y: center.y + 0.35, z: 0.2 }} width={0.55} depth={0.55} height={0.4} className="bld-body" />
    </g>
  );
}

/**
 * Đại đội Xung kích — doanh trại: khối dài có mái, lính chạy quanh khi đang làm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function Barracks({ center }: BuildingProps) {
  const ring = [
    iso({ x: center.x - 0.95, y: center.y - 0.75, z: 0.25 }),
    iso({ x: center.x + 0.95, y: center.y - 0.75, z: 0.25 }),
    iso({ x: center.x + 0.95, y: center.y + 0.75, z: 0.25 }),
    iso({ x: center.x - 0.95, y: center.y + 0.75, z: 0.25 }),
  ];
  const patrol = `M ${ring.map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' L ')} Z`;
  return (
    <g className="building">
      <IsoBox center={center} width={2.1} depth={1.7} height={0.2} className="bld-base" />
      <IsoBox center={{ ...center, z: 0.2 }} width={1.5} depth={0.9} height={0.6} className="bld-body" />
      <IsoBox center={{ ...center, z: 0.8 }} width={1.6} depth={1.0} height={0.08} className="bld-roof-slab" />
      <g className="soldiers">
        {[0, 1, 2].map((index) => (
          <circle key={index} className="soldier" r={2.6}>
            <animateMotion dur="4.5s" begin={`${index * 1.5}s`} repeatCount="indefinite" path={patrol} />
          </circle>
        ))}
      </g>
    </g>
  );
}

/**
 * Ban Kiểm soát — tháp canh: thân cao, buồng gác phía trên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function Watchtower({ center }: BuildingProps) {
  return (
    <g className="building">
      <IsoBox center={center} width={1.3} depth={1.3} height={0.2} className="bld-base" />
      <IsoBox center={{ ...center, z: 0.2 }} width={0.45} depth={0.45} height={1.5} className="bld-body" />
      <IsoBox center={{ ...center, z: 1.7 }} width={0.95} depth={0.95} height={0.5} className="bld-cabin" />
      <Pyramid center={center} half={0.55} base={2.2} height={0.35} />
    </g>
  );
}

/**
 * Hội đồng Nghiệm thu — toà nghiệm thu: khối vuông, mái bằng nhô, bậc thềm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ReviewHall({ center }: BuildingProps) {
  return (
    <g className="building">
      <IsoBox center={center} width={1.7} depth={1.7} height={0.12} className="bld-base" />
      <IsoBox center={{ ...center, z: 0.12 }} width={1.5} depth={1.5} height={0.1} className="bld-base" />
      <IsoBox center={{ ...center, z: 0.22 }} width={1.1} depth={1.1} height={0.85} className="bld-body" />
      <IsoBox center={{ ...center, z: 1.07 }} width={1.35} depth={1.35} height={0.1} className="bld-roof-slab" />
    </g>
  );
}

/**
 * Chọn công trình theo ban.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function BuildingFor({ role, center }: { role: string; center: GridPoint }) {
  const Building = BUILDINGS[role] ?? ReviewHall;
  return <Building center={center} />;
}

const BUILDINGS: Record<string, (props: BuildingProps) => React.JSX.Element> = {
  'ea-trinh-sat': Watchtower,
  'ea-mo-xe': FacadeBoard,
  'ea-nghien-cuu': CommandTent,
  'ea-thiet-ke': Crane,
  'ea-che-tao': Barracks,
  'ea-soat-ma': ReviewHall,
  'ea-dung-ban-thu': Barracks,
  'ea-thu-nghiem': Watchtower,
  'ea-phan-tich': ReviewHall,
  'ea-phan-bien': CommandTent,
  'ea-nghiem-thu': ReviewHall,
  'ea-ghi-nho': FacadeBoard,
  'ea-bao-cao': Crane,
};
