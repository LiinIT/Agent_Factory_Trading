export type GridPoint = { x: number; y: number; z?: number };
export type ScreenPoint = { x: number; y: number };

export const TILE = 46;
const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = 0.5;

/**
 * Chiếu điểm lưới 3D (x sang phải-xuống, y sang trái-xuống, z lên) ra màn hình isometric.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function iso({ x, y, z = 0 }: GridPoint): ScreenPoint {
  return { x: (x - y) * COS_30 * TILE, y: (x + y) * SIN_30 * TILE - z * TILE };
}

/**
 * Đổi ngược điểm màn hình (mặt đất z = 0) về toạ độ lưới — để xếp vật thể theo bố cục màn hình.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function fromScreen({ x, y }: ScreenPoint): GridPoint {
  const difference = x / (COS_30 * TILE);
  const sum = y / (SIN_30 * TILE);
  return { x: (sum + difference) / 2, y: (sum - difference) / 2 };
}

/**
 * Chuỗi `points` cho <polygon> từ các điểm lưới.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function polygonPoints(points: GridPoint[]): string {
  return points
    .map((point) => iso(point))
    .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}

/**
 * Đường `d` cho <path> đi qua các điểm lưới (dùng cho ống dẫn và chuyển động hạt sáng).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function pathThrough(points: GridPoint[]): string {
  return points
    .map((point, index) => {
      const { x, y } = iso(point);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export type BoxFaces = { top: string; left: string; right: string };

/**
 * Ba mặt nhìn thấy của khối hộp tâm (x, y) đặt từ độ cao z: rộng w (trục x), sâu d (trục y), cao h.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function boxFaces(center: GridPoint, w: number, d: number, h: number): BoxFaces {
  const z = center.z ?? 0;
  const x0 = center.x - w / 2;
  const x1 = center.x + w / 2;
  const y0 = center.y - d / 2;
  const y1 = center.y + d / 2;
  const top = z + h;
  return {
    top: polygonPoints([
      { x: x0, y: y0, z: top },
      { x: x1, y: y0, z: top },
      { x: x1, y: y1, z: top },
      { x: x0, y: y1, z: top },
    ]),
    right: polygonPoints([
      { x: x1, y: y0, z: top },
      { x: x1, y: y1, z: top },
      { x: x1, y: y1, z },
      { x: x1, y: y0, z },
    ]),
    left: polygonPoints([
      { x: x0, y: y1, z: top },
      { x: x1, y: y1, z: top },
      { x: x1, y: y1, z },
      { x: x0, y: y1, z },
    ]),
  };
}

/**
 * Ma trận SVG đặt một icon 24×24 lên mặt phẳng đứng x = hằng (tấm thẻ đứng), để icon
 * nghiêng theo phối cảnh. [origin] là góc trên-trái, [width]/[height] tính theo đơn vị lưới.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function cardMatrix(origin: GridPoint, width: number, height: number): string {
  const ICON_SIZE = 24;
  const start = iso(origin);
  const across = iso({ x: origin.x, y: origin.y + width, z: origin.z });
  const down = iso({ x: origin.x, y: origin.y, z: (origin.z ?? 0) - height });
  const a = (across.x - start.x) / ICON_SIZE;
  const b = (across.y - start.y) / ICON_SIZE;
  const c = (down.x - start.x) / ICON_SIZE;
  const d = (down.y - start.y) / ICON_SIZE;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${start.x.toFixed(1)} ${start.y.toFixed(1)})`;
}
