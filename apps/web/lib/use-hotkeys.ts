'use client';

import { useEffect, useRef } from 'react';

import { SCREENS, type ScreenId } from './screens';

export type HotkeyActions = {
  onTogglePalette: () => void;
  onCloseTop: () => void;
  onOpenScreen: (id: ScreenId) => void;
  onRadioStart: () => void;
  onRadioStop: () => void;
  onToggleReadAloud: () => void;
  onTogglePause: () => void;
  onToggleMode: () => void;
  onToggleNote: () => void;
  onOpenHelp: () => void;
  onApproveFirst: () => void;
};

/**
 * Phím tắt toàn cục. Bỏ qua khi đang gõ chữ (trừ ⌘K); giữ Space = bộ đàm. Phím mở màn hình
 * không gõ ký tự vào ô nhập vừa được focus.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function useHotkeys(actions: HotkeyActions): void {
  const latest = useRef(actions);
  latest.current = actions;

  useEffect(() => {
    const isTyping = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      return !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const act = latest.current;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        act.onTogglePalette();
        return;
      }
      if (isTyping(event) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) act.onRadioStart();
        return;
      }
      if (event.repeat) return;
      if (event.key === 'Escape') return act.onCloseTop();
      if (event.key === '?') return act.onOpenHelp();
      if (event.shiftKey && event.key.toLowerCase() === 'a') return act.onApproveFirst();
      const key = event.key.toLowerCase();
      if (key === 'm') return act.onToggleReadAloud();
      if (key === 'p') return act.onTogglePause();
      if (key === 't') return act.onToggleMode();
      if (key === 'n') return act.onToggleNote();
      const screen = SCREENS.find((item) => item.shortcut === event.key);
      if (screen) {
        event.preventDefault();
        act.onOpenScreen(screen.id);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isTyping(event)) latest.current.onRadioStop();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}
