'use client';

import { X } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import type { ReactNode } from 'react';

import type { ScreenDefinition } from '@/lib/screens';

type FloatingWindowProps = {
  screen: ScreenDefinition;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Cửa sổ phụ kiểu terminal nổi trên thế giới: luôn mở giữa màn hình, kéo đi được bằng
 * thanh tiêu đề (desktop), cửa sổ mở sau nằm trên; trên điện thoại CSS biến nó thành tấm
 * trượt từ dưới lên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function FloatingWindow({ screen, zIndex, onFocus, onClose, children }: FloatingWindowProps) {
  const dragControls = useDragControls();
  const Icon = screen.icon;
  const panel = (
    <motion.section
      className={`window is-${screen.id}`}
      role="dialog"
      aria-label={screen.title}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={onFocus}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.16 }}
    >
      <header className="window-bar" onPointerDown={(event) => dragControls.start(event)}>
        <span className="window-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <Icon size={13} aria-hidden />
        <span className="window-title">{screen.command}</span>
        <button className="icon-button is-small" onClick={onClose} onPointerDown={(event) => event.stopPropagation()} aria-label={`Đóng ${screen.title}`}>
          <X size={13} />
        </button>
      </header>
      <div className="window-body">{children}</div>
    </motion.section>
  );
  return (
    <div className="window-center" style={{ zIndex }}>
      {panel}
    </div>
  );
}
