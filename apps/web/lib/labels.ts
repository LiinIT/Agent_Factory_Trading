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
  'ea-trinh-sat': 'Ban Trinh sát',
  'ea-mo-xe': 'Ban Mổ xẻ',
  'ea-nghien-cuu': 'Ban Nghiên cứu',
  'ea-thiet-ke': 'Ban Thiết kế',
  'ea-che-tao': 'Ban Chế tạo',
  'ea-soat-ma': 'Ban Soát mã',
  'ea-dung-ban-thu': 'Ban Dựng bàn thử',
  'ea-thu-nghiem': 'Ban Thử nghiệm',
  'ea-phan-tich': 'Ban Phân tích',
  'ea-phan-bien': 'Ban Phản biện',
  'ea-nghiem-thu': 'Hội đồng Nghiệm thu',
  'ea-ghi-nho': 'Ban Ghi nhớ',
  'ea-bao-cao': 'Ban Báo cáo',
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
