'use client';

import { Command } from 'cmdk';
import { Pause, Play, SendHorizontal } from 'lucide-react';
import { useState } from 'react';

import { STATUS_LABELS, unitLabel } from '@/lib/labels';
import { roleIcon } from '@/lib/role-icons';
import { SCREENS, type ScreenId } from '@/lib/screens';
import type { FactoryState } from '@/lib/types';

const TASK_LIMIT = 30;

type CommandPaletteProps = {
  isOpen: boolean;
  state: FactoryState | null;
  onOpenChange: (isOpen: boolean) => void;
  onOpenScreen: (id: ScreenId) => void;
  onSelectTask: (taskId: number) => void;
  onTogglePause: () => void;
  onSendToManager: (text: string) => void;
};

/**
 * Bảng lệnh ⌘K: mở màn hình, nhảy tới task, tạm dừng/tiếp tục, hoặc gõ câu rồi gửi
 * thẳng cho Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function CommandPalette(props: CommandPaletteProps) {
  const { isOpen, state, onOpenChange, onOpenScreen, onSelectTask, onTogglePause, onSendToManager } = props;
  const [query, setQuery] = useState('');
  const run = (action: () => void) => {
    action();
    setQuery('');
    onOpenChange(false);
  };
  const isPaused = state?.pause.manual ?? false;
  const tasks = (state?.tasks ?? []).slice(-TASK_LIMIT).reverse();

  return (
    <Command.Dialog open={isOpen} onOpenChange={onOpenChange} label="Bảng lệnh" className="palette" overlayClassName="palette-overlay">
      <div className="palette-input">
        <span className="accent">$</span>
        <Command.Input value={query} onValueChange={setQuery} placeholder="Gõ lệnh, tên nhiệm vụ, hoặc lệnh gửi Tham mưu trưởng…" />
      </div>
      <Command.List className="palette-list">
        <Command.Empty className="palette-empty">Không có lệnh khớp.</Command.Empty>
        {query.trim() ? (
          <Command.Group heading="Tham mưu trưởng">
            <Command.Item value={`gửi tham mưu trưởng ${query}`} onSelect={() => run(() => onSendToManager(query.trim()))}>
              <SendHorizontal size={14} aria-hidden /> Ra lệnh Tham mưu trưởng: “{query.trim()}”
            </Command.Item>
          </Command.Group>
        ) : null}
        <Command.Group heading="Màn hình">
          {SCREENS.map((screen) => {
            const Icon = screen.icon;
            return (
              <Command.Item key={screen.id} value={`${screen.title} ${screen.command}`} onSelect={() => run(() => onOpenScreen(screen.id))}>
                <Icon size={14} aria-hidden /> {screen.title}
                <span className="palette-hint">{screen.command}</span>
              </Command.Item>
            );
          })}
        </Command.Group>
        <Command.Group heading="Hàng đợi">
          <Command.Item value={isPaused ? 'tiếp tục hàng đợi resume' : 'tạm dừng hàng đợi pause'} onSelect={() => run(onTogglePause)}>
            {isPaused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            {isPaused ? 'Tiếp tục hàng đợi' : 'Tạm dừng hàng đợi'}
          </Command.Item>
        </Command.Group>
        {tasks.length > 0 ? (
          <Command.Group heading="Task">
            {tasks.map((task) => {
              const Icon = roleIcon(task.role);
              return (
                <Command.Item key={task.id} value={`#${task.id} ${task.title} ${task.projectId}`} onSelect={() => run(() => onSelectTask(task.id))}>
                  <Icon size={14} aria-hidden /> #{task.id} {task.title}
                  <span className="palette-hint">{unitLabel(task.role)} · {STATUS_LABELS[task.status]}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        ) : null}
      </Command.List>
    </Command.Dialog>
  );
}
