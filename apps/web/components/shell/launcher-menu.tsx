'use client';

import { AnimatePresence, motion } from 'motion/react';

import { SCREENS, type ScreenId } from '@/lib/screens';

type LauncherMenuProps = {
  isOpen: boolean;
  openScreens: ScreenId[];
  badges: Partial<Record<ScreenId, number>>;
  onToggleScreen: (id: ScreenId) => void;
  onClose: () => void;
};

/**
 * Menu "list" mở/đóng các màn hình phụ (cửa sổ nổi) trên thế giới vận hành.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function LauncherMenu({ isOpen, openScreens, badges, onToggleScreen, onClose }: LauncherMenuProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <div className="launcher-backdrop" onClick={onClose} aria-hidden />
          <motion.nav
            className="launcher"
            aria-label="Màn hình phụ"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
          >
            <p className="launcher-title">$ ls ./screens</p>
            {SCREENS.map((screen) => {
              const Icon = screen.icon;
              const isOpenScreen = openScreens.includes(screen.id);
              const badge = badges[screen.id];
              return (
                <button key={screen.id} className={`launcher-item ${isOpenScreen ? 'is-open' : ''}`} onClick={() => onToggleScreen(screen.id)}>
                  <Icon size={15} aria-hidden />
                  <span className="launcher-name">{screen.title}</span>
                  {badge ? <span className="badge">{badge}</span> : null}
                  <kbd>{screen.shortcut}</kbd>
                </button>
              );
            })}
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>
  );
}
