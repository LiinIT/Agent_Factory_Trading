'use client';

import { AnimatePresence } from 'motion/react';
import { useCallback, useState } from 'react';

import { ScreenContent } from '@/components/screens/screen-content';
import { CommandPalette } from '@/components/shell/command-palette';
import { ContextRail } from '@/components/shell/context-rail';
import { DutyNote } from '@/components/shell/duty-note';
import { FloatingWindow } from '@/components/shell/floating-window';
import { LauncherMenu } from '@/components/shell/launcher-menu';
import { OrchestrationCard } from '@/components/shell/orchestration-card';
import { RadioOverlay } from '@/components/shell/radio-overlay';
import { ShortcutsHelp } from '@/components/shell/shortcuts-help';
import { TopBar } from '@/components/shell/top-bar';
import { IsoWorld } from '@/components/world/iso-world';
import { api } from '@/lib/api';
import { tasksNeedingOwner } from '@/lib/org';
import { screenById, type ScreenId } from '@/lib/screens';
import { useFactory } from '@/lib/use-factory';
import { useHotkeys } from '@/lib/use-hotkeys';
import { useOwnerAlerts } from '@/lib/use-owner-alerts';
import { useRadio } from '@/lib/use-radio';
import { useSpokenReplies } from '@/lib/use-spoken-replies';
import { useStoredFlag } from '@/lib/use-stored-flag';
import type { VoiceIntent } from '@/lib/voice-commands';

const BASE_WINDOW_Z = 20;
const ACK = 'Rõ.';

/**
 * Trang quản trị phong cách terminal: Biên chế (trái) · Sở chỉ huy dã chiến (giữa) ·
 * Điều phối (phải). Màn hình phụ mở bằng nút list / phím số / ⌘K; bộ đàm giữ Space;
 * ghi chú chức năng các ban ở góc dưới phải. Có việc mới chờ duyệt / trả lời / cấp quyền thì
 * cửa sổ Duyệt tự bật lên và tiêu đề tab hiện số việc chờ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export default function HomePage() {
  const { state, error, connected, liveLogs, refresh } = useFactory();
  const [openScreens, setOpenScreens] = useState<ScreenId[]>([]);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isReadAloud, toggleReadAloud] = useStoredFlag('factory.readAloud', false);
  const [isNoteOpen, toggleNote] = useStoredFlag('factory.dutyNote', true);

  const report = (caught: unknown) => setActionError(caught instanceof Error ? caught.message : String(caught));
  const openScreen = useCallback((id: ScreenId) => {
    setOpenScreens((screens) => [...screens.filter((item) => item !== id), id]);
  }, []);
  const closeScreen = useCallback((id: ScreenId) => {
    setOpenScreens((screens) => screens.filter((item) => item !== id));
  }, []);
  const closeTop = () => setOpenScreens((screens) => screens.slice(0, -1));
  const toggleScreen = (id: ScreenId) => (openScreens.includes(id) ? closeScreen(id) : openScreen(id));
  const selectTask = (taskId: number | null) => {
    setSelectedTaskId(taskId);
    if (taskId !== null) openScreen('log');
  };
  const setPaused = (paused: boolean) => api.setPaused(paused).then(() => refresh()).catch(report);
  const togglePause = () => void setPaused(!(state?.pause.manual ?? false));
  const toggleMode = () => void api.setMode(state?.mode === 'ta-mon' ? 'chuan' : 'ta-mon').then(() => refresh()).catch(report);
  const sendToManager = (text: string) => api.chat(text, projectId).catch(report);
  const approveFirst = () => {
    const task = state?.tasks.find((item) => item.status === 'awaiting_approval');
    if (!task || !window.confirm(`Duyệt nhiệm vụ #${task.id} — ${task.title}?`)) return;
    void api.taskAction(task.id, 'approve').then(() => refresh()).catch(report);
  };

  const radio = useRadio((intent: VoiceIntent, heard: string) => {
    if (intent.kind === 'open') {
      openScreen(intent.screen);
      return `Mở ${screenById(intent.screen).title}.`;
    }
    if (intent.kind === 'close') {
      closeTop();
      return 'Đã đóng cửa sổ.';
    }
    if (intent.kind === 'pause' || intent.kind === 'resume') {
      void setPaused(intent.kind === 'pause');
      return intent.kind === 'pause' ? 'Tạm dừng hàng đợi.' : 'Tiếp tục hàng đợi.';
    }
    if (intent.kind === 'briefing') {
      void api
        .briefing()
        .then((briefing) => {
          radio.showNotice(briefing.text);
          radio.speak(briefing.text);
        })
        .catch(report);
      return 'Đang tổng hợp tình hình…';
    }
    if (isReadAloud) radio.speak(ACK);
    void sendToManager(intent.text);
    return `Đã chuyển Tham mưu trưởng: “${heard}”`;
  });
  useSpokenReplies(state?.messages ?? [], isReadAloud, radio.speak);
  useOwnerAlerts(
    state ? tasksNeedingOwner(state.tasks) : [],
    () => openScreen('approvals'),
    () => closeScreen('approvals'),
  );

  useHotkeys({
    onTogglePalette: () => setIsPaletteOpen((isOpen) => !isOpen),
    onCloseTop: () => (isHelpOpen ? setIsHelpOpen(false) : closeTop()),
    onOpenScreen: openScreen,
    onRadioStart: radio.start,
    onRadioStop: radio.stop,
    onToggleReadAloud: toggleReadAloud,
    onTogglePause: togglePause,
    onToggleMode: toggleMode,
    onToggleNote: toggleNote,
    onOpenHelp: () => setIsHelpOpen(true),
    onApproveFirst: approveFirst,
  });

  const pendingCount = state ? tasksNeedingOwner(state.tasks).length : 0;

  return (
    <div className="app">
      <div className="scanlines" aria-hidden />
      <TopBar
        state={state}
        connected={connected}
        controls={{
          isLauncherOpen,
          isListening: radio.isListening,
          isReadAloud,
          onToggleLauncher: () => setIsLauncherOpen((isOpen) => !isOpen),
          onOpenPalette: () => setIsPaletteOpen(true),
          onTogglePause: togglePause,
          onToggleMode: toggleMode,
          onToggleReadAloud: toggleReadAloud,
          onOpenHelp: () => setIsHelpOpen(true),
          onRadioStart: radio.start,
          onRadioStop: radio.stop,
        }}
      />
      <LauncherMenu
        isOpen={isLauncherOpen}
        openScreens={openScreens}
        badges={{ approvals: pendingCount }}
        onToggleScreen={(id) => {
          toggleScreen(id);
          setIsLauncherOpen(false);
        }}
        onClose={() => setIsLauncherOpen(false)}
      />
      {error || actionError ? <p className="banner error">{error ?? actionError}</p> : null}
      {!state && !error ? <p className="banner muted">$ đang kết nối orchestrator…</p> : null}
      {state ? (
        <main className={`stage ${isNoteOpen ? 'has-note' : ''}`}>
          <ContextRail state={state} onSelectTask={selectTask} onOpenSystem={() => openScreen('tree')} />
          <section className="world-column">
            <p className="column-title is-center">Sở chỉ huy dã chiến</p>
            <p className="column-subtitle">thế giới vận hành · shared delivery context</p>
            <IsoWorld
              state={state}
              liveLogs={liveLogs}
              onOpenManager={() => openScreen('chat')}
              onOpenSystem={() => openScreen('tree')}
              onOpenDamage={() => openScreen('damage')}
              onOpenApprovals={() => openScreen('approvals')}
              onSelectTask={selectTask}
            />
          </section>
          <OrchestrationCard
            state={state}
            liveLogs={liveLogs}
            onOpenApprovals={() => openScreen('approvals')}
            onOpenChat={() => openScreen('chat')}
            onOpenReports={() => openScreen('reports')}
            onOpenDamage={() => openScreen('damage')}
            onOpenSandbox={() => openScreen('sandbox')}
            onSelectTask={selectTask}
            onChanged={() => void refresh()}
          />
          <DutyNote team={state.team} isOpen={isNoteOpen} onToggle={toggleNote} />
          <AnimatePresence>
            {openScreens.map((id, index) => (
              <FloatingWindow
                key={id}
                screen={screenById(id)}
                zIndex={BASE_WINDOW_Z + index}
                onFocus={() => openScreen(id)}
                onClose={() => closeScreen(id)}
              >
                <ScreenContent
                  id={id}
                  state={state}
                  liveLogs={liveLogs}
                  selectedTaskId={selectedTaskId}
                  projectId={projectId}
                  onSelectTask={selectTask}
                  onProjectChange={setProjectId}
                  onTogglePause={togglePause}
                  onOpenSandbox={() => openScreen('sandbox')}
                  onChanged={() => void refresh()}
                />
              </FloatingWindow>
            ))}
          </AnimatePresence>
        </main>
      ) : null}
      <RadioOverlay isListening={radio.isListening} interim={radio.interim} notice={radio.notice} error={radio.voiceError} />
      <ShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <CommandPalette
        isOpen={isPaletteOpen}
        state={state}
        onOpenChange={setIsPaletteOpen}
        onOpenScreen={openScreen}
        onSelectTask={selectTask}
        onTogglePause={togglePause}
        onSendToManager={(text) => void sendToManager(text).then(() => openScreen('chat'))}
      />
    </div>
  );
}
