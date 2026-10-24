import {
  Activity,
  KeyRound,
  ClipboardCheck,
  Gauge,
  ListTree,
  type LucideIcon,
  FileChartColumn,
  MessagesSquare,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

export type ScreenId = 'chat' | 'approvals' | 'log' | 'tree' | 'quota' | 'reports' | 'damage' | 'bot-reports' | 'env';

export type ScreenDefinition = {
  id: ScreenId;
  title: string;
  command: string;
  icon: LucideIcon;
  shortcut: string;
};

export const SCREENS: ScreenDefinition[] = [
  { id: 'chat', title: 'Liên lạc Tham mưu trưởng', command: 'radio --tham-muu-truong', icon: MessagesSquare, shortcut: '1' },
  { id: 'approvals', title: 'Duyệt · trả lời · cấp quyền', command: 'chi-huy --pending', icon: ShieldCheck, shortcut: '2' },
  { id: 'log', title: 'Nhật ký tác chiến', command: 'tail -f nhat-ky.log', icon: ScrollText, shortcut: '3' },
  { id: 'tree', title: 'Biên chế & nhiệm vụ', command: 'tree ./don-vi', icon: ListTree, shortcut: '4' },
  { id: 'quota', title: 'Quota & hàng đợi', command: 'quota --status', icon: Gauge, shortcut: '5' },
  { id: 'reports', title: 'Báo cáo các ban', command: 'bao-cao --all', icon: ClipboardCheck, shortcut: '6' },
  { id: 'damage', title: 'Thiệt hại (Ban Hậu cần)', command: 'hau-can --thiet-hai', icon: Activity, shortcut: '7' },
  { id: 'bot-reports', title: 'Hồ sơ & báo cáo bot (Ban Báo cáo)', command: 'bao-cao --bot', icon: FileChartColumn, shortcut: '8' },
  { id: 'env', title: 'Env · nguồn hoả lực & API key', command: 'env --nguon-hoa-luc', icon: KeyRound, shortcut: '`' },
];

/**
 * Định nghĩa màn hình phụ theo id.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function screenById(id: ScreenId): ScreenDefinition {
  const screen = SCREENS.find((item) => item.id === id);
  if (!screen) throw new Error(`Không có màn hình ${id}`);
  return screen;
}
