import type { FactoryBus } from './bus.ts';
import { log } from './logger.ts';
import {
  applyManagerActions,
  MANAGER_ROLE,
  type ProjectOps,
  MANAGER_SCHEMA,
  parseManagerDecision,
} from './manager-actions.ts';
import type { Logistics } from './logistics.ts';
import type { ModeState } from './mode.ts';
import type { QuotaState } from './quota-state.ts';
import type { FactoryStore } from './store.ts';
import type { MessageSender, RoleDefinition, RunClaude, Task } from './types.ts';
import type { Workspace } from './workspace.ts';

const MS_PER_MINUTE = 60_000;
const OUTPUT_PREVIEW = 300;
const CONVERSATION_SENDERS = new Set<MessageSender>(['user', 'manager', 'system']);
const HISTORY_SCAN_FACTOR = 4;
export const PENDING_RETRY_KEY = 'manager_pending_retry';
export const ACCOUNT_CARD_AUTHOR = 'doi-tai-khoan';

export type ManagerDeps = {
  store: FactoryStore;
  team: Map<string, RoleDefinition>;
  runClaude: RunClaude;
  bus: FactoryBus;
  workspace: Workspace;
  quota: QuotaState;
  logistics: Logistics;
  mode: ModeState;
  timeoutMinutes: number;
  historyLimit: number;
  resolveDir?: (input: string) => string;
  projectOps?: ProjectOps;
};

export type ManagerInput = {
  sender: Exclude<MessageSender, 'manager'>;
  text: string;
  projectId?: string | null;
};

/**
 * Tham mưu trưởng: nhận lệnh của Chỉ huy trưởng hoặc sự kiện cần quyết định, hỏi
 * Claude (chỉ đọc), rồi áp dụng hành động lập project / giao nhiệm vụ.
 * Mỗi lần chỉ xử lý một tin để trạng thái không bị chồng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class Manager {
  readonly deps: ManagerDeps;
  private queue: Promise<void> = Promise.resolve();
  private busy = false;

  /**
   * Khởi tạo với các phụ thuộc.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(deps: ManagerDeps) {
    this.deps = deps;
  }

  /**
   * Tham mưu trưởng có đang suy nghĩ không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  isBusy(): boolean {
    return this.busy;
  }

  /**
   * Xếp một tin vào hàng của quản lý; Promise xong khi quản lý đã trả lời.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  consult(input: ManagerInput, isRetry = false): Promise<void> {
    if (!isRetry) this.deps.store.addMessage(input.sender, input.text, input.projectId ?? null);
    this.deps.bus.publish({ type: 'state' });
    this.queue = this.queue.then(() => this.handle(input)).catch((error: unknown) => {
      log.error({ err: error }, '[Manager] lỗi không mong muốn');
      this.deps.store.addMessage('system', `Tham mưu trưởng gặp lỗi: ${String(error)}`, input.projectId ?? null);
    });
    return this.queue;
  }

  /**
   * Chờ mọi tin đang xếp hàng xử lý xong (dùng trong test).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  idle(): Promise<void> {
    return this.queue;
  }

  /**
   * Có tin nào của Chỉ huy trưởng đang chờ gửi lại vì hết quota không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  hasPendingRetry(): boolean {
    return this.deps.store.getSetting<ManagerInput | null>(PENDING_RETRY_KEY, null) !== null;
  }

  /**
   * Gửi lại tin gần nhất bị lỗi vì hết quota (không ghi lại tin vào chat); không có thì bỏ qua.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  retryPending(): boolean {
    const input = this.deps.store.getSetting<ManagerInput | null>(PENDING_RETRY_KEY, null);
    if (!input) return false;
    this.deps.store.setSetting(PENDING_RETRY_KEY, null);
    log.info({ projectId: input.projectId }, '[Manager] gửi lại tin bị lỗi quota');
    void this.consult(input, true);
    return true;
  }

  /**
   * Gọi Claude cho một tin và áp dụng quyết định.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private async handle(input: ManagerInput): Promise<void> {
    const { store, team, bus, workspace, quota, logistics } = this.deps;
    const role = team.get(MANAGER_ROLE);
    if (!role) throw new Error('Thiếu team/tham-muu-truong.md');
    const projectId = input.projectId ?? null;
    this.setBusy(true);
    const start = logistics.startRun();
    const plan = this.deps.mode.roleRun(role);
    try {
      const result = await this.deps.runClaude({
        cwd: workspace.dirs.workspaceDir,
        prompt: this.buildPrompt(input),
        systemPrompt: plan.systemPrompt,
        model: plan.model,
        effort: plan.effort,
        role: MANAGER_ROLE,
        allowedTools: role.allowedTools,
        jsonSchema: MANAGER_SCHEMA,
        timeoutMs: this.deps.timeoutMinutes * MS_PER_MINUTE,
        onEvent: (event) => {
          if (event.kind !== 'quota') return;
          quota.update(event.quota);
          logistics.observeQuota(start, event.quota);
        },
      });
      if (result.quota) quota.update(result.quota);
      logistics.recordRun({ taskId: null, projectId, role: MANAGER_ROLE }, start, result);
      if (result.isUsageLimit) {
        store.setSetting(PENDING_RETRY_KEY, input);
        store.addMessage('system', `Tham mưu trưởng chưa trả lời được: ${result.text}`, projectId, ACCOUNT_CARD_AUTHOR);
        return;
      }
      if (!result.ok) {
        store.addMessage('system', `Tham mưu trưởng chưa trả lời được: ${result.text}`, projectId);
        return;
      }
      if (input.sender === 'user') store.setSetting(PENDING_RETRY_KEY, null);
      const decision = parseManagerDecision(result.structured);
      if (!decision) {
        store.addMessage('system', 'Tham mưu trưởng trả về sai định dạng, bỏ qua lượt này.', projectId);
        return;
      }
      const outcome = await applyManagerActions(decision.actions, {
        store,
        team,
        currentProjectId: projectId,
        createProject: (name, brief, dir) => this.createProject(name, brief, dir),
        resolveDir: this.deps.resolveDir,
        projectOps: this.deps.projectOps,
      });
      log.info({ outcome }, '[Manager] áp dụng hành động');
      store.addMessage('manager', decision.reply, projectId ?? outcome.createdProjects.at(-1) ?? null);
      if (outcome.done.length > 0) {
        store.addMessage('system', `Máy đã làm: ${outcome.done.join('; ')}`, projectId);
      }
      if (outcome.rejected.length > 0) {
        store.addMessage('system', `Bỏ qua: ${outcome.rejected.join('; ')}`, projectId);
      }
    } finally {
      this.setBusy(false);
      bus.publish({ type: 'state' });
    }
  }

  /**
   * Tạo project trong DB + thư mục ([dir] Chỉ huy trưởng chọn, không có thì nơi mặc định `<workspaceDir>/<id>`).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private createProject(name: string, brief: string, dir?: string): string {
    const { store, workspace } = this.deps;
    const id = workspace.uniqueId(name, (candidate) => !!store.getProject(candidate));
    workspace.create(id, name, brief, dir);
    store.insertProject({ id, name, brief, dir: dir ?? null });
    return id;
  }

  /**
   * Đổi cờ bận và báo cho web.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.deps.bus.publish({ type: 'manager', busy });
  }

  /**
   * Prompt cho Tham mưu trưởng: biên chế, project đang xét (đầy đủ) + các project
   * khác (tóm tắt), hội thoại gần đây (bỏ báo cáo/thiệt hại để đỡ token), tin mới.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  buildPrompt(input: ManagerInput): string {
    const { store, team, historyLimit } = this.deps;
    const roles = [...team.values()]
      .filter((role) => role.name !== MANAGER_ROLE)
      .map((role) => `- ${role.name}: ${role.unit} (${role.title})${role.gate ? ' — chờ Chỉ huy trưởng duyệt' : ''}`)
      .join('\n');
    const focusId = input.projectId ?? null;
    const projects = store.listProjects().map((project) => {
      const tasks = store.listTasks(project.id);
      if (focusId && project.id !== focusId) {
        return { id: project.id, name: project.name, tasks: `${tasks.filter((task) => task.status === 'done').length}/${tasks.length} xong` };
      }
      return { id: project.id, name: project.name, tasks: tasks.map(summarizeTask) };
    });
    const history = store
      .recentMessages(historyLimit * HISTORY_SCAN_FACTOR)
      .filter((message) => CONVERSATION_SENDERS.has(message.sender))
      .slice(0, -1)
      .slice(-historyLimit)
      .map((message) => `[${message.sender}${message.projectId ? ` @${message.projectId}` : ''}] ${message.text}`)
      .join('\n');
    return [
      `Hôm nay: ${new Date().toISOString().slice(0, 10)}`,
      `## Biên chế\n${roles}`,
      `## Project và nhiệm vụ (tài liệu ở <projectId>/brain/, GUI demo ở <projectId>/design/)\n${JSON.stringify(projects)}`,
      `## Hội thoại gần đây\n${history || '(trống)'}`,
      `## Tin mới cần xử lý — từ ${input.sender}${input.projectId ? ` về project ${input.projectId}` : ''}\n${input.text}`,
    ].join('\n\n');
  }
}

/**
 * Tóm tắt một nhiệm vụ cho Tham mưu trưởng: dùng kết luận báo cáo thay vì toàn văn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function summarizeTask(task: Task) {
  const outcome = task.report
    ? `${task.report.result}; vướng: ${task.report.obstacles}; đề xuất: ${task.report.proposal}`
    : (task.error ?? '');
  return {
    id: task.id,
    seq: task.seq,
    role: task.role,
    title: task.title,
    status: task.status,
    result: outcome.slice(0, OUTPUT_PREVIEW),
  };
}
