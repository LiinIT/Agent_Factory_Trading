'use client';

import { Keyboard, X } from 'lucide-react';

import { SCREENS } from '@/lib/screens';

const GENERAL_SHORTCUTS: [string, string][] = [
  ['Giữ Space', 'Bộ đàm: nói với Tham mưu trưởng, thả ra để gửi'],
  ['M', 'Bật/tắt đọc to báo cáo (giọng Linh)'],
  ['P', 'Tạm dừng / tiếp tục hàng đợi'],
  ['T', 'Bật/tắt chế độ Tà môn'],
  ['Shift + A', 'Duyệt việc chờ duyệt đầu tiên (có xác nhận)'],
  ['N', 'Ẩn/hiện ghi chú chức năng các ban'],
  ['⌘ K', 'Bảng lệnh'],
  ['Esc', 'Đóng cửa sổ trên cùng'],
  ['?', 'Bảng phím tắt này'],
];

const VOICE_COMMANDS = ['"mở báo cáo bot" · "mở thiệt hại" · "mở nhật ký" …', '"báo cáo tình hình"', '"tạm dừng" · "tiếp tục" · "đóng"'];

type ShortcutsHelpProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Bảng phím tắt và lệnh giọng nói máy tự xử lý (không tốn token).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null;
  const rows: [string, string][] = [...GENERAL_SHORTCUTS, ...SCREENS.map((screen): [string, string] => [screen.shortcut, screen.title])];
  return (
    <div className="help-overlay" onClick={onClose}>
      <section className="help" role="dialog" aria-label="Phím tắt" onClick={(event) => event.stopPropagation()}>
        <header className="help-head">
          <Keyboard size={15} aria-hidden className="accent" />
          <span>$ man phim-tat</span>
          <button className="icon-button is-small" onClick={onClose} aria-label="Đóng bảng phím tắt">
            <X size={13} />
          </button>
        </header>
        <dl className="help-list">
          {rows.map(([key, label]) => (
            <div key={key}>
              <dt><kbd>{key}</kbd></dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">Lệnh giọng nói máy tự xử lý:</p>
        <ul className="help-voice">
          {VOICE_COMMANDS.map((command) => <li key={command}>{command}</li>)}
        </ul>
        <p className="muted small">Câu khác được chuyển nguyên văn cho Tham mưu trưởng.</p>
      </section>
    </div>
  );
}
