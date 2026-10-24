import type { BaseDefinition } from './bases.ts';
import { CHECK_ROLES, planBugFix } from './bug-loop.ts';
import type { FactoryBus } from './bus.ts';
import { log } from './logger.ts';
import type { Logistics, RunStart } from './logistics.ts';
import {
  ACCEPTANCE_CHECK,
  describeMachineCheck,
  FULL_CHECK,
  QUICK_CHECK,
  runCommand,
  runMachineCheck,
  type CheckPlan,
  type RunCommand,
} from './machine-check.ts';
import type { ManagerInput } from './manager.ts';
import type { ModeState } from './mode.ts';
import { checkPermission } from './permission-policy.ts';
import { DEFAULT_PROVIDER } from './providers.ts';
import type { QuotaState } from './quota-state.ts';
import { formatReport, parseReport, REPORT_SCHEMA } from './report.ts';
import type { FactoryStore } from './store.ts';
import type { AgentReport, RoleDefinition, RunClaude, RunResult, StreamEvent, Task } from './types.ts';
import type { Workspace } from './workspace.ts';

const MS_PER_MINUTE = 60_000;
const PERCENT = 100;
const CODE_ROLES = new Set(['xung-kich']);
const RESULT_PREVIEW = 600;
const OWNER = 'Chỉ huy trưởng';
const CHECK_ROLE = 'kiem-soat';
const ACCEPTANCE_ROLE = 'nghiem-thu';
const MACHINE_MODEL = 'may-kiem-soat';
const DEFAULT_BUG_ROUNDS = 5;

export type SchedulerDeps = {
  store: FactoryStore;
  team: Map<string, RoleDefinition>;
  runClaude: RunClaude;
  bus: FactoryBus;
  workspace: Workspace;
  quota: QuotaState;
  logistics: Logistics;
  mode: ModeState;
  base: BaseDefinition | null;
  runCheck?: RunCommand;
  iosSimulator?: string | null;
  bugLoopMaxRounds?: number;
  notifyManager: (input: ManagerInput) => void;
  canRunRole?: (role: string) => boolean;
  concurrency: number;
};

/**
 * Ban Thông tin (máy tự chạy): lấy nhiệm vụ kế tiếp, giao cho đúng ban chạy trong
 * thư mục project, nhận báo cáo JSON, chuyển trạng thái, chuyển báo cáo về Tham mưu
 * trưởng. Tham mưu trưởng (AI) chỉ được gọi khi cần quyết định.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class Scheduler {
  readonly deps: SchedulerDeps;
  private readonly running = new Map<number, Promise<void>>();
  private timer: NodeJS.Timeout | null = null;
  private stopping = false;

  /**
   * Khởi tạo với các phụ thuộc.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(deps: SchedulerDeps) {
    this.deps = deps;
  }

  /**
   * Bắt đầu vòng kiểm tra hàng đợi định kỳ.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  start(intervalMs: number): void {
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.tick();
  }

  /**
   * Dừng vòng kiểm tra (task đang chạy vẫn chạy tới khi tiến trình bị tắt).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  stop(): void {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * id các task đang chạy.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  runningTaskIds(): number[] {
    return [...this.running.keys()];
  }

  /**
   * Chờ mọi task đang chạy xong (dùng trong test).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  async idle(): Promise<void> {
    await Promise.all(this.running.values());
  }

  /**
   * Một nhịp: nếu không bị tạm dừng thì lấp đủ số task chạy song song; ban của task kế
   * tiếp hết sạch nguồn thì chờ nhịp sau.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  tick(): void {
    const { store, quota, concurrency, canRunRole } = this.deps;
    while (!this.stopping && !quota.isPaused() && this.running.size < concurrency) {
      const task = store.nextRunnableTask();
      if (!task) return;
      if (canRunRole && !canRunRole(task.role)) {
        log.debug({ taskId: task.id, role: task.role }, '[Scheduler] ban hết nguồn, chờ quota');
        return;
      }
      const run = this.runTask(task).finally(() => {
        this.running.delete(task.id);
        this.tick();
      });
      this.running.set(task.id, run);
    }
  }

  /**
   * Chạy một nhiệm vụ: giao lệnh, theo dõi thiệt hại (dừng nếu vượt ngưỡng), nhận báo cáo.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private async runTask(task: Task): Promise<void> {
    const { store, team, bus, workspace, logistics } = this.deps;
    const role = team.get(task.role);
    if (!role) {
      this.fail(task, `Không có ban ${task.role} trong team/`);
      return;
    }
    store.updateTask(task.id, { status: 'running', startedAt: new Date().toISOString(), error: null });
    bus.publish({ type: 'state' });
    log.info({ taskId: task.id, role: task.role }, '[Scheduler] giao nhiệm vụ');
    const start = logistics.startRun();
    const controller = new AbortController();
    const plan = this.deps.mode.roleRun(role);
    const projectDir = workspace.projectDir(task.projectId);
    try {
      let machineNote = '';
      const checkPlan = this.machinePlan(role.name, plan.useMachineCheck);
      if (checkPlan && this.deps.base) {
        const check = await runMachineCheck(projectDir, this.deps.base.parts, this.deps.runCheck ?? runCommand, checkPlan);
        if (this.stopping) return;
        const summary = describeMachineCheck(check);
        store.addTaskEvent(task.id, 'system', summary);
        if (check.ok && plan.useMachineCheck && role.name === CHECK_ROLE) {
          this.finish(store.requireTask(task.id), role, machineResult(task, check.durationMs, summary), start);
          return;
        }
        machineNote = `\n\n## Kết quả máy đã chạy (không chạy lại toàn bộ — dùng làm bằng chứng)\n${summary}`;
      }
      const result = await this.deps.runClaude({
        cwd: projectDir,
        prompt: `${buildTaskPrompt(task, store.getProject(task.projectId)?.name ?? task.projectId, role)}${machineNote}`,
        systemPrompt: plan.systemPrompt,
        model: plan.model,
        effort: plan.effort,
        role: role.name,
        allowedTools: [...new Set([...role.allowedTools, ...task.extraTools])],
        jsonSchema: REPORT_SCHEMA,
        timeoutMs: role.timeoutMinutes * MS_PER_MINUTE,
        resumeSessionId: task.feedback ? task.sessionId : null,
        signal: controller.signal,
        onEvent: (event) => this.onStreamEvent(task.id, event, start, controller),
      });
      if (this.stopping) return;
      this.finish(store.requireTask(task.id), role, result, start);
    } catch (error) {
      log.error({ err: error, taskId: task.id }, '[Scheduler] lỗi khi chạy nhiệm vụ');
      this.fail(store.requireTask(task.id), String(error));
    } finally {
      bus.publish({ type: 'state' });
    }
  }

  /**
   * Máy kiểm trước cho ban kiểm: Kiểm soát — rút gọn (Tà môn) hoặc đủ ma trận;
   * Nghiệm thu — toàn bộ barem máy của mọi phần (format, analyze, test, build, store_check, integration).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private machinePlan(roleName: string, isTaMon: boolean): CheckPlan | null {
    if (roleName === ACCEPTANCE_ROLE) return { ...ACCEPTANCE_CHECK, simulator: this.deps.iosSimulator ?? null };
    if (roleName === CHECK_ROLE) return isTaMon ? QUICK_CHECK : FULL_CHECK;
    return null;
  }

  /**
   * Ghi log, model, session, quota trong lúc chạy; quota 5h tăng quá ngưỡng thì dừng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private onStreamEvent(taskId: number, event: StreamEvent, start: RunStart, controller: AbortController): void {
    const { store, bus, quota, logistics } = this.deps;
    if (event.kind === 'session') store.updateTask(taskId, { sessionId: event.sessionId, model: event.model });
    if (event.kind === 'quota') {
      quota.update(event.quota);
      if (!controller.signal.aborted && logistics.exceedsAlarm(start, event.quota)) {
        const threshold = Math.round(logistics.alarmFiveHourDelta * PERCENT);
        controller.abort(`Ban Hậu cần báo động: nhiệm vụ đã tiêu hao quá ${threshold}% quota 5 giờ. Đã dừng, chờ lệnh.`);
      }
    }
    if (event.kind === 'text' || event.kind === 'tool') {
      store.addTaskEvent(taskId, event.kind, event.text);
      bus.publish({ type: 'log', taskId, kind: event.kind, text: event.text });
    }
  }

  /**
   * Xử lý kết quả: ghi thiệt hại; hết quota → về hàng đợi; lỗi → failed; xong → commit,
   * nhận báo cáo, chuyển sang chờ trả lời / chờ duyệt / xong, chuyển báo cáo về Tham mưu trưởng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private finish(task: Task, role: RoleDefinition, result: RunResult, start: RunStart): void {
    const { store, workspace, quota, logistics } = this.deps;
    if (result.quota) quota.update(result.quota);
    const run = logistics.recordRun({ taskId: task.id, projectId: task.projectId, role: role.name }, start, result);
    store.addMessage('logistics', logistics.runLine(run), task.projectId, 'hau-can');
    this.recordDenials(task, role, result.permissionDenials);
    store.updateTask(task.id, { sessionId: result.sessionId ?? task.sessionId, model: result.model ?? task.model });
    if (result.isUsageLimit) {
      store.updateTask(task.id, { status: 'queued', startedAt: null });
      store.addTaskEvent(task.id, 'system', 'Hết quota — nhiệm vụ quay lại hàng đợi, chạy tiếp khi quota reset.');
      quota.markUsageLimit(result.provider ?? DEFAULT_PROVIDER);
      return;
    }
    if (!result.ok) {
      this.fail(task, result.text);
      return;
    }
    workspace.commitAll(task.projectId, `${CODE_ROLES.has(role.name) ? 'feat' : 'docs'}(${role.name}): ${task.title}`);
    const report = parseReport(result.structured);
    const reportText = report
      ? formatReport(
          { taskId: task.id, unit: role.unit, model: result.model, assignedBy: task.assignedBy, expected: task.expected, verification: task.verification },
          report,
        )
      : `BÁO CÁO #${task.id} · ${role.unit} → Tham mưu trưởng\n${preview(result.text)}`;
    store.addMessage('report', reportText, task.projectId, role.name);
    const isFailedCheck = CHECK_ROLES.has(role.name) && report?.result === 'KHÔNG ĐẠT';
    const questions = report ? questionsFor(report, role.gate) : [];
    const status = nextStatus(questions.length > 0, role.gate && !isFailedCheck);
    store.updateTask(task.id, {
      status,
      report,
      questions,
      output: reportText,
      feedback: null,
      finishedAt: new Date().toISOString(),
    });
    log.info({ taskId: task.id, status, result: report?.result }, '[Scheduler] nhận báo cáo');
    if (status === 'awaiting_answer') {
      store.addMessage('system', `${role.unit} xin ý kiến ${OWNER} (nhiệm vụ #${task.id}): ${questions.join(' · ')}`, task.projectId);
      return;
    }
    if (status === 'awaiting_approval') {
      store.addMessage('system', `Nhiệm vụ #${task.id} (${role.unit}: ${task.title}) chờ ${OWNER} duyệt.`, task.projectId);
      return;
    }
    if (isFailedCheck && report) {
      this.startBugLoop(store.requireTask(task.id), role, report, reportText);
      return;
    }
    if (report?.result === 'KHÔNG ĐẠT') {
      this.notify(task, `Báo cáo KHÔNG ĐẠT từ ${role.unit}:\n${reportText}`);
      return;
    }
    if (!store.hasOpenTasks(task.projectId)) {
      this.postPhaseDamage(task.projectId, `sau ${role.unit}`);
      this.notify(task, `Hết nhiệm vụ trong hàng. Báo cáo cuối:\n${reportText}`);
    }
  }

  /**
   * Vòng diệt lỗi: ban kiểm báo KHÔNG ĐẠT → máy tự giao Xung kích sửa + giao kiểm lại
   * (chen lên đầu hàng), không cần Tham mưu trưởng. Quá số vòng → dừng, xin lệnh.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private startBugLoop(task: Task, role: RoleDefinition, report: AgentReport, reportText: string): void {
    const { store } = this.deps;
    const maxRounds = this.deps.bugLoopMaxRounds ?? DEFAULT_BUG_ROUNDS;
    const plan = planBugFix(task, report, maxRounds);
    if (!plan) {
      store.addMessage('system', `Ban Thông tin: đã qua ${maxRounds} vòng diệt lỗi mà ${role.unit} vẫn báo KHÔNG ĐẠT (nhiệm vụ #${task.id}). Xin lệnh ${OWNER}.`, task.projectId);
      this.notify(task, `Vượt ${maxRounds} vòng diệt lỗi, cần quyết định:\n${reportText}`);
      return;
    }
    store.insertTask(plan.recheck);
    const fix = store.insertTask(plan.fix);
    store.addMessage('system', `Ban Thông tin: vòng diệt lỗi ${plan.round}/${maxRounds} — giao Đại đội Xung kích sửa (#${fix.id}), ${role.unit} kiểm lại ngay sau.`, task.projectId);
    log.info({ taskId: task.id, round: plan.round, fixId: fix.id }, '[Scheduler] vòng diệt lỗi');
  }

  /**
   * Lưu các lệnh bị chặn ở lần chạy này để Chỉ huy trưởng xem và cấp quyền; quyền thuộc nhóm
   * cấm (Ban Bảo mật không bao giờ cấp, vd `Bash(cd *)`) hoặc quyền vai đã có (bị chặn do nối
   * nhiều lệnh) chỉ ghi nhật ký, không đưa lên xét.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private recordDenials(task: Task, role: RoleDefinition, denials: string[]): void {
    const { store } = this.deps;
    const owned = new Set([...role.allowedTools, ...task.extraTools]);
    const grantable: string[] = [];
    const forbidden: string[] = [];
    const chained: string[] = [];
    for (const tool of denials) {
      const verdict = checkPermission(tool);
      if (owned.has(tool)) chained.push(tool);
      else if (verdict.allowed) grantable.push(tool);
      else forbidden.push(`${tool} (${verdict.reason})`);
    }
    if (chained.length > 0) store.addTaskEvent(task.id, 'system', `Đã có quyền ${chained.join(', ')} nhưng bị chặn vì nối nhiều lệnh trong một lần chạy — không cần cấp thêm.`);
    store.updateTask(task.id, { deniedTools: grantable });
    if (denials.length > 0) store.addTaskEvent(task.id, 'denied', `Bị chặn: ${denials.join(', ')}`);
    if (forbidden.length > 0) store.addTaskEvent(task.id, 'system', `Ban Bảo mật chặn hẳn, không đưa ${OWNER} xét: ${forbidden.join(', ')}`);
    if (grantable.length === 0) return;
    store.addMessage(
      'system',
      `Ban Bảo mật: nhiệm vụ #${task.id} bị chặn ${grantable.length} quyền (${grantable.join(', ')}). Vào "Duyệt & quyền" nếu muốn cấp.`,
      task.projectId,
    );
  }


  /**
   * Ban Hậu cần đăng báo cáo tổng thiệt hại của một đợt.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private postPhaseDamage(projectId: string, phase: string): void {
    const summary = this.deps.logistics.summarizeProject(projectId, phase);
    if (summary) this.deps.store.addMessage('logistics', summary, projectId, 'hau-can');
  }

  /**
   * Chỉ huy trưởng cấp thêm một quyền cho riêng nhiệm vụ này rồi cho chạy lại (tiếp phiên cũ).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  grant(taskId: number, tool: string): Task {
    const task = this.requireStatus(taskId, ['done', 'failed', 'awaiting_approval', 'awaiting_answer']);
    const verdict = checkPermission(tool);
    if (!verdict.allowed) throw new Error(`Ban Bảo mật không cấp "${tool}": ${verdict.reason}`);
    const permission = tool.trim();
    const updated = this.deps.store.updateTask(taskId, {
      status: 'queued',
      extraTools: [...new Set([...task.extraTools, permission])],
      deniedTools: task.deniedTools.filter((item) => item !== permission),
      feedback: `${OWNER} đã cấp quyền ${permission}. Làm tiếp phần việc trước đó bị chặn.`,
      error: null,
      finishedAt: null,
    });
    this.deps.store.addTaskEvent(taskId, 'system', `Cấp quyền ${permission}${verdict.risky ? ' (có rủi ro: mạng/cài gói)' : ''}`);
    this.afterChange();
    return updated;
  }

  /**
   * Chỉ huy trưởng trả lời câu hỏi → nhiệm vụ chạy tiếp (tiếp phiên cũ) với câu trả lời.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  answer(taskId: number, answer: string): Task {
    const task = this.requireStatus(taskId, ['awaiting_answer']);
    const questions = task.questions.map((question, index) => `(${index + 1}) ${question}`).join('\n');
    const updated = this.deps.store.updateTask(taskId, {
      status: 'queued',
      questions: [],
      feedback: `Câu hỏi:\n${questions}\n\n${OWNER} trả lời:\n${answer}`,
      finishedAt: null,
    });
    this.deps.store.addTaskEvent(taskId, 'system', `${OWNER} trả lời: ${answer}`);
    this.afterChange();
    return updated;
  }

  /**
   * Đánh dấu nhiệm vụ lỗi và báo Tham mưu trưởng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private fail(task: Task, error: string): void {
    this.deps.store.updateTask(task.id, { status: 'failed', error, finishedAt: new Date().toISOString() });
    log.warn({ taskId: task.id, error }, '[Scheduler] nhiệm vụ lỗi');
    this.notify(task, `Nhiệm vụ #${task.id} (${task.role}: ${task.title}) bị lỗi: ${preview(error)}`);
  }

  /**
   * Chuyển sự kiện cần quyết định lên Tham mưu trưởng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private notify(task: Task, text: string): void {
    this.deps.notifyManager({ sender: 'system', text, projectId: task.projectId });
  }

  /**
   * Chỉ huy trưởng duyệt → done, Ban Hậu cần tổng kết đợt, Tham mưu trưởng lập bước tiếp.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  approve(taskId: number): Task {
    const task = this.requireStatus(taskId, ['awaiting_approval']);
    const unit = this.deps.team.get(task.role)?.unit ?? task.role;
    const updated = this.deps.store.updateTask(taskId, { status: 'done' });
    this.postPhaseDamage(task.projectId, `đợt ${unit}`);
    this.notify(task, `${OWNER} đã DUYỆT nhiệm vụ #${task.id} (${unit}: ${task.title}). Lập bước tiếp theo.`);
    this.afterChange();
    return updated;
  }

  /**
   * Chỉ huy trưởng trả lại kèm phản hồi → chạy lại (tiếp phiên cũ) theo phản hồi.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  reject(taskId: number, feedback: string): Task {
    this.requireStatus(taskId, ['awaiting_approval', 'done']);
    const updated = this.deps.store.updateTask(taskId, { status: 'queued', feedback, finishedAt: null });
    this.deps.store.addTaskEvent(taskId, 'system', `${OWNER} trả lại: ${feedback}`);
    this.afterChange();
    return updated;
  }

  /**
   * Chạy lại nhiệm vụ lỗi.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  retry(taskId: number): Task {
    this.requireStatus(taskId, ['failed']);
    const updated = this.deps.store.updateTask(taskId, { status: 'queued', error: null, finishedAt: null });
    this.afterChange();
    return updated;
  }

  /**
   * Bỏ nhiệm vụ để các nhiệm vụ sau của project được chạy tiếp.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  cancel(taskId: number): Task {
    this.requireStatus(taskId, ['queued', 'failed', 'awaiting_approval', 'awaiting_answer']);
    const updated = this.deps.store.updateTask(taskId, { status: 'cancelled', finishedAt: new Date().toISOString() });
    this.afterChange();
    return updated;
  }

  /**
   * Lấy nhiệm vụ và đảm bảo nó đang ở trạng thái cho phép.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private requireStatus(taskId: number, allowed: Task['status'][]): Task {
    const task = this.deps.store.requireTask(taskId);
    if (!allowed.includes(task.status)) {
      throw new Error(`Nhiệm vụ #${taskId} đang ${task.status}, không làm được thao tác này`);
    }
    return task;
  }

  /**
   * Báo web và thử chạy nhiệm vụ kế tiếp sau một thao tác của Chỉ huy trưởng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private afterChange(): void {
    this.deps.bus.publish({ type: 'state' });
    this.tick();
  }
}

/**
 * Kết quả giả lập khi máy kiểm soát ĐẠT: báo cáo ĐẠT, 0 token, không gọi AI.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function machineResult(task: Task, durationMs: number, evidence: string): RunResult {
  return {
    ok: true,
    text: evidence,
    structured: {
      mission: task.title,
      result: 'ĐẠT',
      evidence,
      obstacles: 'Không',
      questions: [],
      proposal: 'Giao nhiệm vụ kế tiếp theo kế hoạch',
    },
    sessionId: null,
    model: MACHINE_MODEL,
    isUsageLimit: false,
    quota: null,
    costUsd: 0,
    permissionDenials: [],
    usage: { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 },
    durationMs,
  };
}

/**
 * Trạng thái sau khi nhận báo cáo: hỏi > chờ duyệt > xong.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function nextStatus(hasQuestions: boolean, hasGate: boolean): Task['status'] {
  if (hasQuestions) return 'awaiting_answer';
  if (hasGate) return 'awaiting_approval';
  return 'done';
}

/**
 * Lệnh giao nhiệm vụ: chức vụ, nhiệm vụ, kết quả mong muốn, cách thử, phản hồi (nếu có).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function buildTaskPrompt(task: Task, projectName: string, role: RoleDefinition): string {
  const parts = [
    `# LỆNH GIAO NHIỆM VỤ #${task.id}`,
    `Người nhận: ${role.title} (${role.unit}) · Giao bởi: ${task.assignedBy} · Project: ${projectName}`,
    `## Nhiệm vụ: ${task.title}\n${task.detail}`,
    `## Kết quả mong muốn\n${task.expected || 'Theo tiêu chí trong brain/.'}`,
    `## Cách thử\n${task.verification || 'Theo skill verification-loop và device-matrix.'}`,
    'Kết thúc bằng báo cáo JSON theo quân lệnh trong CLAUDE.md. Chưa rõ điểm nào: hỏi, không đoán.',
  ];
  if (task.feedback) {
    parts.push(`## Chỉ thị bổ sung của ${OWNER}\n${task.feedback}\n\nLàm đúng theo chỉ thị này, không mở rộng phạm vi.`);
  }
  return parts.join('\n\n');
}

/**
 * Cắt ngắn văn bản gửi Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function preview(text: string): string {
  return text.length > RESULT_PREVIEW ? `${text.slice(0, RESULT_PREVIEW)}…` : text;
}

/**
 * Câu hỏi cần Chỉ huy trưởng trả lời. Ban báo CẦN HỎI mà không ghi câu hỏi: ban có cổng duyệt
 * thì để cổng duyệt lo (không hỏi); ban khác thì hỏi ý kiến về đề xuất của ban, kèm đáp án gợi ý.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function questionsFor(report: AgentReport, isGated: boolean): string[] {
  if (report.questions.length > 0 || report.result !== 'CẦN HỎI' || isGated) return report.questions;
  const subject = report.proposal || report.obstacles || report.mission;
  return [`Ban xin ý kiến: ${subject} [Đồng ý | Không đồng ý]`];
}
