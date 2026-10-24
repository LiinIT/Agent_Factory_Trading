import { boxFaces, type GridPoint } from '@/lib/iso';

type IsoBoxProps = {
  center: GridPoint;
  width: number;
  depth: number;
  height: number;
  className?: string;
};

/**
 * Khối hộp isometric (3 mặt nhìn thấy); màu từng mặt do CSS theo [className] quyết định.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function IsoBox({ center, width, depth, height, className = '' }: IsoBoxProps) {
  const faces = boxFaces(center, width, depth, height);
  return (
    <g className={`iso-box ${className}`}>
      <polygon className="face-left" points={faces.left} />
      <polygon className="face-right" points={faces.right} />
      <polygon className="face-top" points={faces.top} />
    </g>
  );
}
