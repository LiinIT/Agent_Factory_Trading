import type { NewTask } from './store.ts';
import type { AgentReport, Task } from './types.ts';

export const CHECK_ROLES = new Set(['kiem-soat', 'nghiem-thu']);
export const FIX_ROLE = 'xung-kich';

const ROUND_PREFIX = /^(?:Diệt lỗi|Kiểm lại) vòng (\d+): /;

export type BugFixPlan = {
  round: number;
  fix: NewTask;
  recheck: NewTask;
};

/**
 * Vòng diệt lỗi hiện tại của nhiệm vụ (0 nếu là lần kiểm đầu).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function bugRound(title: string): number {
  const match = ROUND_PREFIX.exec(title);
  return match ? Number(match[1]) : 0;
}

/**
 * Tiêu đề gốc, bỏ tiền tố "Diệt lỗi / Kiểm lại vòng N:".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function baseTitle(title: string): string {
  return title.replace(ROUND_PREFIX, '');
}

/**
 * Lập vòng diệt lỗi kế tiếp khi một ban kiểm báo KHÔNG ĐẠT: một nhiệm vụ sửa cho
 * Đại đội Xung kích và một nhiệm vụ kiểm lại cho đúng ban vừa kiểm. Vượt [maxRounds]
 * thì trả null (dừng, xin lệnh Thủ trưởng).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function planBugFix(task: Task, report: AgentReport, maxRounds: number): BugFixPlan | null {
  const round = bugRound(task.title) + 1;
  if (round > maxRounds) return null;
  const subject = baseTitle(task.title);
  return {
    round,
    fix: {
      projectId: task.projectId,
      role: FIX_ROLE,
      title: `Diệt lỗi vòng ${round}: ${subject}`,
      detail: [
        `Sửa **đúng và đủ** các lỗi mà ${task.role} báo trong nhiệm vụ #${task.id} — không làm việc khác.`,
        `Lỗi cần sửa:\n${report.obstacles}`,
        `Bằng chứng của bên kiểm:\n${report.evidence}`,
        'Viết / sửa test tái hiện từng lỗi trước khi sửa (test phải FAIL trước, PASS sau).',
      ].join('\n\n'),
      expected: 'Mọi lỗi trong danh sách đã hết, có test chứng minh; analyze sạch, toàn bộ test pass.',
      verification: 'flutter analyze; flutter test (đủ ma trận thiết bị); test tái hiện từng lỗi.',
      assignedBy: 'ban-thong-tin',
      gate: false,
      urgent: true,
    },
    recheck: {
      projectId: task.projectId,
      role: task.role,
      title: `Kiểm lại vòng ${round}: ${subject}`,
      detail: `Kiểm lại toàn bộ sau vòng diệt lỗi ${round}. Danh sách lỗi đã báo ở nhiệm vụ #${task.id}:\n${report.obstacles}\n\nKiểm cả lỗi mới phát sinh, không chỉ lỗi cũ.`,
      expected: task.expected || 'Không còn lỗi; checklist liên quan ĐẠT.',
      verification: task.verification || 'Như nhiệm vụ kiểm trước.',
      assignedBy: 'ban-thong-tin',
      gate: false,
      urgent: true,
    },
  };
}
