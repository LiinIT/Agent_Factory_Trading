'use client';

import { useEffect, useRef, useState } from 'react';

const STAGE_PADDING = 12;

type SandboxFrameProps = {
  src: string;
  width: number | null;
  height: number | null;
};

/**
 * Khung cách ly hiện GUI demo, luôn thấy trọn máy: không có cỡ thì phủ kín vùng xem (bản demo
 * tự co máy); có cỡ máy thì dựng đúng cỡ rồi thu nhỏ cho vừa vùng xem (không cắt, không cuộn).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function SandboxFrame({ src, width, height }: SandboxFrameProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = stage.current;
    if (!element || !width || !height) return;
    const measure = () => {
      const availableWidth = element.clientWidth - STAGE_PADDING * 2;
      const availableHeight = element.clientHeight - STAGE_PADDING * 2;
      setScale(Math.min(1, availableWidth / width, availableHeight / height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  const isFixed = Boolean(width && height);
  return (
    <div ref={stage} className={`sandbox-stage ${isFixed ? 'is-fixed' : 'is-fill'}`}>
      <div className="sandbox-box" style={isFixed ? { width: (width ?? 0) * scale, height: (height ?? 0) * scale } : undefined}>
        <iframe
          title="GUI demo"
          className="sandbox-frame"
          src={src}
          sandbox="allow-scripts allow-forms"
          referrerPolicy="no-referrer"
          style={isFixed ? { width: width ?? 0, height: height ?? 0, transform: `scale(${scale})` } : undefined}
        />
      </div>
    </div>
  );
}
