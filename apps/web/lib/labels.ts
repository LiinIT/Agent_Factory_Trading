import type { TaskStatus } from './types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: 'Chờ chạy',
  running: 'Đang làm',
  awaiting_approval: 'Chờ duyệt',
  awaiting_answer: 'Chờ trả lời',
  done: 'Xong',
  failed: 'Lỗi',
  cancelled: 'Đã bỏ',
};

export const ROLE_LABELS: Record<string, string> = {
  'tham-muu-truong': 'Tham mưu trưởng',
  'tac-chien': 'Ban Tác chiến',
  'ngoai-giao': 'Ban Ngoại giao',
  'cong-binh': 'Ban Công binh',
  'xung-kich': 'Đại đội Xung kích',
  'kiem-soat': 'Ban Kiểm soát',
  'nghiem-thu': 'Hội đồng Nghiệm thu',
  'hau-can': 'Ban Hậu cần',
};

export const OWNER_TITLE = 'Chỉ huy trưởng';

/**
 * Giờ:phút dễ đọc từ mốc thời gian (ms).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function formatClock(milliseconds: number): string {
  return new Date(milliseconds).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

/**
 * Tên đơn vị của một mã vai (mã lạ giữ nguyên).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function unitLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
