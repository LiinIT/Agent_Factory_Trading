import type { FactoryStore } from './store.ts';
import type { RoleDefinition } from './types.ts';

export const MANAGER_ROLE = 'tham-muu-truong';

export const MANAGER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'actions'],
  properties: {
    reply: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['create_project', 'create_task', 'cancel_task', 'clean_generated', 'apply_base'] },
          taskId: { type: 'integer' },
          name: { type: 'string' },
          brief: { type: 'string' },
          dir: { type: 'string' },
          projectId: { type: 'string' },
          role: { type: 'string' },
          title: { type: 'string' },
          detail: { type: 'string' },
          expected: { type: 'string' },
          verification: { type: 'string' },
          urgent: { type: 'boolean' },
        },
      },
    },
  },
} as const;

export type ManagerAction = {
  type: string;
  name?: string;
  brief?: string;
  dir?: string;
  projectId?: string;
  role?: string;
  title?: string;
  detail?: string;
  expected?: string;
  verification?: string;
  urgent?: boolean;
  taskId?: number;
};

export type ManagerDecision = {
  reply: string;
  actions: ManagerAction[];
};

export type ActionContext = {
  store: FactoryStore;
  team: Map<string, RoleDefinition>;
  createProject: (name: string, brief: string, dir?: string) => string;
  resolveDir?: (input: string) => string;
  currentProjectId: string | null;
  projectOps?: ProjectOps;
};

/** Thao tác máy trên nhiệm vụ / thư mục project mà Tham mưu trưởng được gọi khi Thủ trưởng ra lệnh. */
export type ProjectOps = {
  cancelTask: (taskId: number) => void;
  cleanGenerated: (projectId: string) => Promise<string[]>;
  applyBase: (projectId: string) => string[];
};

export type ActionOutcome = {
  createdProjects: string[];
  createdTasks: number[];
  done: string[];
  rejected: string[];
};

/**
 * Kiểm tra JSON quản lý trả về đúng dạng `{reply, actions[]}`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function parseManagerDecision(value: unknown): ManagerDecision | null {
  if (!value || typeof value !== 'object') return null;
  const { reply, actions } = value as Record<string, unknown>;
  if (typeof reply !== 'string') return null;
  const validActions = Array.isArray(actions)
    ? actions.filter(
        (action): action is ManagerAction =>
          !!action && typeof action === 'object' && typeof (action as ManagerAction).type === 'string',
      )
    : [];
  return { reply, actions: validActions };
}

/**
 * Nơi lưu Chỉ huy trưởng chỉ định cho project mới; sai thì ghi lý do và dùng nơi mặc định.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function projectDirOf(action: ManagerAction, context: ActionContext, outcome: ActionOutcome): string | undefined {
  const input = action.dir?.trim();
  if (!input) return undefined;
  if (!context.resolveDir) {
    outcome.rejected.push('chưa hỗ trợ chọn nơi lưu — đã lập ở nơi mặc định');
    return undefined;
  }
  try {
    return context.resolveDir(input);
  } catch (error) {
    outcome.rejected.push(`nơi lưu "${input}" không dùng được (${error instanceof Error ? error.message : String(error)}) — đã lập ở nơi mặc định`);
    return undefined;
  }
}

/**
 * Áp dụng lần lượt các hành động của quản lý. Hành động sai (thiếu trường, vai
 * không tồn tại, project không có, task trùng) bị bỏ và ghi lý do.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export async function applyManagerActions(actions: ManagerAction[], context: ActionContext): Promise<ActionOutcome> {
  const outcome: ActionOutcome = { createdProjects: [], createdTasks: [], done: [], rejected: [] };
  let lastProjectId = context.currentProjectId;
  for (const action of actions) {
    if (action.type === 'create_project') {
      if (!action.name?.trim() || !action.brief?.trim()) {
        outcome.rejected.push('create_project thiếu name/brief');
        continue;
      }
      const dir = projectDirOf(action, context, outcome);
      lastProjectId = context.createProject(action.name.trim(), action.brief.trim(), dir);
      outcome.createdProjects.push(lastProjectId);
      continue;
    }
    if (action.type === 'create_task') {
      const rejection = createTask(action, action.projectId?.trim() || lastProjectId, context, outcome);
      if (rejection) outcome.rejected.push(rejection);
      continue;
    }
    if (PROJECT_OP_TYPES.has(action.type)) {
      try {
        outcome.done.push(await runProjectOp(action, action.projectId?.trim() || lastProjectId, context));
      } catch (error) {
        outcome.rejected.push(`${action.type}: ${error instanceof Error ? error.message : String(error)}`);
      }
      continue;
    }
    outcome.rejected.push(`hành động không hỗ trợ: ${action.type}`);
  }
  return outcome;
}

const PROJECT_OP_TYPES = new Set(['cancel_task', 'clean_generated', 'apply_base']);

/**
 * Chạy một thao tác máy (bỏ nhiệm vụ / dọn file sinh tự động / bổ sung khung chuẩn); trả câu báo đã làm,
 * lỗi thì ném để ghi vào danh sách bỏ qua.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
async function runProjectOp(action: ManagerAction, projectId: string | null | undefined, context: ActionContext): Promise<string> {
  const ops = context.projectOps;
  if (!ops) throw new Error('máy chưa hỗ trợ thao tác này');
  if (action.type === 'cancel_task') {
    const taskId = action.taskId;
    if (typeof taskId !== 'number' || !context.store.getTask(taskId)) throw new Error(`không có nhiệm vụ #${taskId}`);
    ops.cancelTask(taskId);
    return `đã bỏ nhiệm vụ #${taskId}`;
  }
  if (!projectId || !context.store.getProject(projectId)) throw new Error(`không có project: ${projectId}`);
  if (action.type === 'clean_generated') {
    const trashed = await ops.cleanGenerated(projectId);
    return trashed.length > 0 ? `đã chuyển vào Thùng rác (${projectId}): ${trashed.join(', ')}` : `không có file sinh tự động để dọn (${projectId})`;
  }
  const added = ops.applyBase(projectId);
  return added.length > 0 ? `đã bổ sung khung chuẩn (${projectId}): ${added.join(', ')}` : `project ${projectId} đã đủ khung chuẩn`;
}

/**
 * Tạo một task từ hành động; trả lý do từ chối hoặc null nếu tạo được.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function createTask(
  action: ManagerAction,
  projectId: string | null | undefined,
  context: ActionContext,
  outcome: ActionOutcome,
): string | null {
  const role = action.role ? context.team.get(action.role) : undefined;
  const title = action.title?.trim();
  if (!role || role.name === MANAGER_ROLE) return `ban không hợp lệ: ${action.role}`;
  if (!title || !action.detail?.trim()) return `nhiệm vụ "${title ?? ''}" thiếu title/detail`;
  if (!action.expected?.trim() || !action.verification?.trim()) return `nhiệm vụ "${title}" thiếu kết quả mong muốn / cách thử`;
  if (!projectId || !context.store.getProject(projectId)) return `không có project: ${projectId}`;
  if (context.store.hasOpenTaskTitled(projectId, title)) return `nhiệm vụ trùng: ${title}`;
  const task = context.store.insertTask({
    projectId,
    role: role.name,
    title,
    detail: action.detail.trim(),
    expected: action.expected.trim(),
    verification: action.verification.trim(),
    assignedBy: MANAGER_ROLE,
    gate: role.gate,
    urgent: action.urgent === true,
  });
  outcome.createdTasks.push(task.id);
  return null;
}
