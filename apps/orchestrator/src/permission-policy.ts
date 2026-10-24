const TOOL_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\([^()]{1,200}\))?$/;

const FORBIDDEN = [
  { pattern: /^Bash$/, reason: 'Bash không giới hạn = chạy được mọi lệnh' },
  { pattern: /^Bash\(\*/, reason: 'Bash(*) không giới hạn = chạy được mọi lệnh' },
  { pattern: /^Bash\((sudo|su|doas)\b/, reason: 'không cấp quyền root' },
  { pattern: /^Bash\(git push\b|^Bash\(git \*/, reason: 'push chỉ chủ nhân tự làm' },
  { pattern: /^Bash\((rm|dd|mkfs|chmod|chown|shutdown|reboot|launchctl|security|ssh|scp)\b/, reason: 'lệnh phá huỷ / hệ thống / bí mật' },
  { pattern: /^Bash\((cd|bash|sh|zsh|eval|exec|env|xargs)\b/, reason: 'lệnh bọc ngoài vượt được danh sách quyền' },
];

const RISKY = /^Bash\((curl|wget|npm|npx|pip|pip3|brew|docker|node|python|python3)\b|^WebFetch$/;

export type PermissionVerdict =
  | { allowed: true; risky: boolean }
  | { allowed: false; reason: string };

/**
 * Xét một quyền chủ nhân muốn cấp thêm cho task: sai cú pháp hoặc thuộc nhóm
 * cấm thì từ chối; nhóm có mạng / cài gói thì cho nhưng đánh dấu rủi ro.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function checkPermission(tool: string): PermissionVerdict {
  const trimmed = tool.trim();
  if (!TOOL_PATTERN.test(trimmed)) return { allowed: false, reason: 'sai cú pháp, ví dụ đúng: Bash(curl *)' };
  const forbidden = FORBIDDEN.find((rule) => rule.pattern.test(trimmed));
  if (forbidden) return { allowed: false, reason: forbidden.reason };
  return { allowed: true, risky: RISKY.test(trimmed) };
}
