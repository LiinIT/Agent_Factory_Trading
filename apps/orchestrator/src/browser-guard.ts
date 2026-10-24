export const BROWSER_TOOL_PREFIX = 'mcp__claude-in-chrome__';

export type BrowserPolicy = {
  allowedHosts: string[];
  deviceId?: string;
};

const CLICK_ACTIONS = new Set(['left_click', 'scroll', 'scroll_to', 'screenshot', 'zoom', 'wait', 'hover']);
const NAVIGATE_TOOL = `${BROWSER_TOOL_PREFIX}navigate`;
const COMPUTER_TOOL = `${BROWSER_TOOL_PREFIX}computer`;
const BACK_FORWARD = new Set(['back', 'forward']);

/**
 * Vai có dùng công cụ trình duyệt (Claude in Chrome) không.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function usesBrowser(allowedTools: string[]): boolean {
  return allowedTools.some((tool) => tool.startsWith(BROWSER_TOOL_PREFIX));
}

/**
 * Tên miền [host] thuộc danh sách cho phép (đúng tên miền hoặc tên miền con).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function isAllowedHost(host: string, allowedHosts: string[]): boolean {
  const lower = host.toLowerCase();
  return allowedHosts.some((allowed) => lower === allowed || lower.endsWith(`.${allowed}`));
}

/**
 * Chốt chặn cho một dòng mô tả tool (`<tên tool>: <url hoặc hành động>`): đi ra ngoài danh sách
 * tên miền, hoặc thao tác ngoài đọc/cuộn/bấm đơn (gõ phím, kéo thả, bấm phải, bấm đúp) đều là vi phạm.
 * Trả lý do vi phạm, hoặc null nếu hợp lệ / không phải tool trình duyệt. Đây là chốt báo động
 * sau khi lệnh đã phát; chặn thật sự là quyền trang của tiện ích Chrome.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function browserViolation(toolSummary: string, allowedHosts: string[]): string | null {
  const separator = toolSummary.indexOf(': ');
  const name = separator < 0 ? toolSummary : toolSummary.slice(0, separator);
  const target = separator < 0 ? '' : toolSummary.slice(separator + 2).trim();
  if (name === NAVIGATE_TOOL) {
    if (BACK_FORWARD.has(target)) return null;
    const host = hostOf(target);
    if (!host) return `Trinh sát mở địa chỉ không hợp lệ: ${target || '(trống)'}`;
    return isAllowedHost(host, allowedHosts) ? null : `Trinh sát mở trang ngoài danh sách cho phép: ${host} (cho phép: ${allowedHosts.join(', ')})`;
  }
  if (name === COMPUTER_TOOL && !CLICK_ACTIONS.has(target)) return `Trinh sát dùng thao tác trình duyệt không được phép: ${target || '(không rõ)'}`;
  return null;
}

/**
 * Tên miền của địa chỉ (thiếu giao thức thì coi là https như công cụ navigate); giao thức khác http(s) → null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function hostOf(address: string): string | null {
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(address) ? address : `https://${address}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.hostname : null;
  } catch {
    return null;
  }
}

/**
 * Lời nhắc quy tắc trình duyệt gắn vào lệnh giao việc của vai có dùng trình duyệt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function browserBriefing(policy: BrowserPolicy): string {
  const lines = [
    '## Quy tắc trình duyệt (bắt buộc)',
    `- Chỉ mở các tên miền: ${policy.allowedHosts.join(', ')}. Mở trang khác hoặc gõ phím/kéo thả/bấm phải/bấm đúp ⇒ nhiệm vụ bị dừng.`,
    '- Luôn mở **tab mới** (tabs_create_mcp), không dùng tab của Chỉ huy trưởng. Khi xong **đóng mọi tab bạn đã mở**, kể cả tab do tabs_context_mcp (createIfEmpty) tự tạo.',
    '- Chỉ đọc: không đăng nhập, không theo dõi/thích/bình luận, không "Use on chart", không động vào tài khoản, thanh toán, cài đặt. Không ghi lại thông tin cá nhân nhìn thấy trên trang.',
    '- Chỉ được bấm tab "Source code" (hoặc mở rộng mô tả) để đọc mã công khai, rồi dùng get_page_text.',
  ];
  if (policy.deviceId) lines.push(`- Nếu công cụ báo có nhiều trình duyệt, gọi select_browser với deviceId ${policy.deviceId}.`);
  return lines.join('\n');
}
