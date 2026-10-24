import type { DamageTotals, FactoryState, Task, TeamRole } from './types';

export const MANAGER_ROLE = 'tham-muu-truong';

export type RoleActivity = {
  role: TeamRole;
  running: Task | null;
  waiting: Task[];
  asking: Task[];
  queued: number;
  done: number;
  blocked: number;
  lastFinished: Task | null;
};

export type NodeState = 'working' | 'asking' | 'waiting' | 'blocked' | 'idle';

export const ROLE_ORDER = [
  'ea-trinh-sat',
  'ea-mo-xe',
  'ea-nghien-cuu',
  'ea-thiet-ke',
  'ea-che-tao',
  'ea-soat-ma',
  'ea-dung-ban-thu',
  'ea-thu-nghiem',
  'ea-phan-tich',
  'ea-phan-bien',
  'ea-nghiem-thu',
  'ea-ghi-nho',
  'ea-bao-cao',
];

const ROLE_SHORT: Record<string, string> = {
  'tham-muu-truong': 'tham-muu',
  'ea-trinh-sat': 'trinh-sat',
  'ea-mo-xe': 'mo-xe',
  'ea-nghien-cuu': 'nghien-cuu',
  'ea-thiet-ke': 'thiet-ke',
  'ea-che-tao': 'che-tao',
  'ea-soat-ma': 'soat-ma',
  'ea-dung-ban-thu': 'dung-ban-thu',
  'ea-thu-nghiem': 'thu-nghiem',
  'ea-phan-tich': 'phan-tich',
  'ea-phan-bien': 'phan-bien',
  'ea-nghiem-thu': 'nghiem-thu',
  'ea-ghi-nho': 'ghi-nho',
  'ea-bao-cao': 'bao-cao',
};

const PERCENT = 100;
const TOKENS_PER_K = 1000;

/**
 * Tình hình công việc của từng ban (trừ Tham mưu trưởng), theo thứ tự chiến dịch.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function roleActivities(state: FactoryState): RoleActivity[] {
  return state.team
    .filter((role) => role.name !== MANAGER_ROLE)
    .toSorted((first, second) => rolePosition(first.name) - rolePosition(second.name))
    .map((role) => {
      const tasks = state.tasks.filter((task) => task.role === role.name);
      const finished = tasks.filter((task) => task.finishedAt).toSorted((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
      return {
        role,
        running: tasks.find((task) => task.status === 'running') ?? null,
        waiting: tasks.filter((task) => task.status === 'awaiting_approval'),
        asking: tasks.filter((task) => task.status === 'awaiting_answer'),
        queued: tasks.filter((task) => task.status === 'queued').length,
        done: tasks.filter((task) => task.status === 'done').length,
        blocked: tasks.filter((task) => task.status === 'failed' || task.deniedTools.length > 0).length,
        lastFinished: finished[0] ?? null,
      };
    });
}

/**
 * Trạng thái hiển thị: đang làm > đang hỏi > chờ duyệt > bị chặn > rảnh.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function nodeState(activity: RoleActivity): NodeState {
  if (activity.running) return 'working';
  if (activity.asking.length > 0) return 'asking';
  if (activity.waiting.length > 0) return 'waiting';
  if (activity.blocked > 0) return 'blocked';
  return 'idle';
}

/**
 * Nhiệm vụ đáng hiển thị nhất của một ban.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function focusTaskOf(activity: RoleActivity): Task | null {
  return activity.running ?? activity.asking[0] ?? activity.waiting[0] ?? null;
}

/**
 * Mã ngắn kiểu terminal của ban (dùng cho nhãn `xung-kich@...`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function roleShort(roleName: string): string {
  return ROLE_SHORT[roleName] ?? roleName;
}

/**
 * Nhiệm vụ cần Chỉ huy trưởng: chờ duyệt, chờ trả lời, bị chặn quyền, hoặc lỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function tasksNeedingOwner(tasks: Task[]): Task[] {
  return tasks.filter(
    (task) =>
      task.status === 'awaiting_approval' ||
      task.status === 'awaiting_answer' ||
      task.status === 'failed' ||
      (task.deniedTools.length > 0 && task.status === 'done'),
  );
}

/**
 * Model rút gọn để hiển thị (`claude-sonnet-5-5` → `sonnet-5-5`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function shortModel(model: string | null, fallback: string): string {
  return (model ?? fallback).replace(/^claude-/, '');
}

/**
 * Một dòng thiệt hại gọn: "5h +3% · 182k tok · ≈$0.41".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function damageLine(damage: DamageTotals | undefined): string {
  if (!damage || damage.runs === 0) return 'chưa có thiệt hại';
  const percent = Math.round(damage.fiveHourDelta * PERCENT);
  const tokens = Math.round((damage.inputTokens + damage.outputTokens) / TOKENS_PER_K);
  return `5h +${percent}% · ${tokens}k tok · ≈$${damage.costUsd.toFixed(2)}`;
}

/**
 * Cắt chuỗi cho vừa ô chữ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/**
 * Vị trí của ban theo trình tự chiến dịch (ban lạ xếp cuối).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function rolePosition(roleName: string): number {
  const index = ROLE_ORDER.indexOf(roleName);
  return index === -1 ? ROLE_ORDER.length : index;
}
