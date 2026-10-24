'use client';

import { Command, Keyboard, LayoutGrid, Mic, Pause, Play, Radio, Skull, TerminalSquare, Volume2, VolumeX } from 'lucide-react';

import { formatClock } from '@/lib/labels';
import type { FactoryState } from '@/lib/types';

import { MiniMeter } from './mini-meter';

export type TopBarControls = {
  isLauncherOpen: boolean;
  isListening: boolean;
  isReadAloud: boolean;
  onToggleLauncher: () => void;
  onOpenPalette: () => void;
  onTogglePause: () => void;
  onToggleMode: () => void;
  onToggleReadAloud: () => void;
  onOpenHelp: () => void;
  onRadioStart: () => void;
  onRadioStop: () => void;
};

type TopBarProps = {
  state: FactoryState | null;
  connected: boolean;
  controls: TopBarControls;
};

/**
 * Thanh lệnh trên cùng: prompt, kết nối, chế độ, quota, bộ đàm, đọc to, tạm dừng,
 * phím tắt, ⌘K, nút list màn hình.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function TopBar({ state, connected, controls }: TopBarProps) {
  const pause = state?.pause;
  const isManualPause = pause?.manual ?? false;
  const isTaMon = state?.mode === 'ta-mon';
  return (
    <header className="topbar">
      <div className="prompt">
        <TerminalSquare size={16} className="accent" aria-hidden />
        <span className="prompt-user">thu-truong@dv2</span>
        <span className="muted">:~$</span>
        <span className={`signal ${connected ? 'is-on' : 'is-off'}`}>{connected ? 'online' : 'offline'}</span>
        <button className={`signal mode-switch ${isTaMon ? 'is-ta-mon' : ''}`} onClick={controls.onToggleMode} title="Đổi chế độ (T)">
          {isTaMon ? <Skull size={11} aria-hidden /> : null}
          {isTaMon ? 'TÀ MÔN · tiết kiệm' : 'CHUẨN'}
        </button>
        {pause?.until ? <span className="signal is-warn">quota nghỉ tới {formatClock(pause.until)}</span> : null}
      </div>
      <div className="topbar-right">
        <MiniMeter label="5h" window={state?.quota?.fiveHour ?? null} />
        <MiniMeter label="7d" window={state?.quota?.sevenDay ?? null} />
        <button
          className={`icon-button ${controls.isListening ? 'is-live' : ''}`}
          onPointerDown={controls.onRadioStart}
          onPointerUp={controls.onRadioStop}
          onPointerLeave={() => controls.isListening && controls.onRadioStop()}
          title="Bộ đàm — giữ để nói (giữ Space)"
          aria-label="Bộ đàm, giữ để nói"
          aria-pressed={controls.isListening}
        >
          {controls.isListening ? <Radio size={15} /> : <Mic size={15} />}
        </button>
        <button
          className={`icon-button ${controls.isReadAloud ? 'is-active' : ''}`}
          onClick={controls.onToggleReadAloud}
          title={controls.isReadAloud ? 'Tắt đọc to (M)' : 'Bật đọc to (M)'}
          aria-label={controls.isReadAloud ? 'Tắt đọc to' : 'Bật đọc to'}
        >
          {controls.isReadAloud ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button className="icon-button" onClick={controls.onTogglePause} title={isManualPause ? 'Tiếp tục hàng đợi (P)' : 'Tạm dừng hàng đợi (P)'} aria-label={isManualPause ? 'Tiếp tục hàng đợi' : 'Tạm dừng hàng đợi'}>
          {isManualPause ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <button className="icon-button" onClick={controls.onOpenHelp} title="Phím tắt (?)" aria-label="Phím tắt">
          <Keyboard size={15} />
        </button>
        <button className="icon-button" onClick={controls.onOpenPalette} title="Bảng lệnh (⌘K)" aria-label="Mở bảng lệnh">
          <Command size={15} />
        </button>
        <button
          className={`icon-button ${controls.isLauncherOpen ? 'is-active' : ''}`}
          onClick={controls.onToggleLauncher}
          title="Danh sách màn hình"
          aria-label="Danh sách màn hình"
          aria-expanded={controls.isLauncherOpen}
        >
          <LayoutGrid size={15} />
        </button>
      </div>
    </header>
  );
}
