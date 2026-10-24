import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

import { ALT_ACCOUNT, ALT_SECRET, parseAccountCommand, type AccountDesk } from './accounts.ts';
import type { BusEvent, FactoryBus } from './bus.ts';
import { buildBriefing, situationFacts } from './briefing.ts';
import type { Logistics } from './logistics.ts';
import { log } from './logger.ts';
import { listReports, serveReport } from './reports.ts';
import type { Manager } from './manager.ts';
import type { ProjectDesk } from './projects.ts';
import type { ModeState } from './mode.ts';
import { claudeLoginStatus, codexLoginStatus, ollamaStatus } from './env-status.ts';
import { PROVIDERS, type ProviderRouter } from './providers.ts';
import { secretHint, type SecretStore } from './secrets.ts';
import type { QuotaState } from './quota-state.ts';
import type { Scheduler } from './scheduler.ts';
import type { Workspace } from './workspace.ts';
import type { FactoryStore } from './store.ts';
import type { RoleDefinition } from './types.ts';

const MAX_BODY_BYTES = 64 * 1024;
const MESSAGE_LIMIT = 200;
const TASK_EVENT_LIMIT = 300;
const SSE_HEARTBEAT_MS = 25_000;
const TOKEN_HEADER = 'x-factory-token';
const TASK_ACTION = /^\/api\/tasks\/(\d+)\/(approve|reject|retry|cancel|grant|answer)$/;
const REPORTS_ROUTE = /^\/api\/projects\/([a-z0-9-]{1,60})\/reports(\/.*)?$/;
const TASK_EVENTS = /^\/api\/tasks\/(\d+)\/events$/;
const PROJECT_ACTION = /^\/api\/projects\/([a-z0-9-]{1,60})\/(dir|remote|push|delete)$/;
const PASTED_SECRET = /sk-ant-[A-Za-z0-9_-]{16,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}/;
const MIN_TOKEN_LENGTH = 20;

export type ServerDeps = {
  store: FactoryStore;
  scheduler: Scheduler;
  manager: Manager;
  accounts: AccountDesk;
  projects: ProjectDesk;
  quota: QuotaState;
  bus: FactoryBus;
  logistics: Logistics;
  mode: ModeState;
  localModel: string;
  router: ProviderRouter;
  secrets: SecretStore;
  envTestDir: string;
  workspace: Workspace;
  team: Map<string, RoleDefinition>;
  token: string;
};

class HttpError extends Error {
  readonly status: number;

  /**
   * Lỗi có mã HTTP để trả về cho web.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * HTTP API cho web quản trị (chỉ nghe localhost, mọi route trừ /api/health cần token).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function createApiServer(deps: ServerDeps): Server {
  return createServer((request, response) => {
    handle(deps, request, response).catch((error: unknown) => {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) log.error({ err: error, url: request.url }, '[Server] lỗi');
      sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
    });
  });
}

/**
 * Định tuyến một request.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function handle(deps: ServerDeps, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const route = `${request.method} ${url.pathname}`;
  if (route === 'GET /api/health') return sendJson(response, 200, { ok: true });
  if (!isAuthorized(request, deps.token)) throw new HttpError(401, 'Sai hoặc thiếu token');

  if (route === 'GET /api/state') return sendJson(response, 200, snapshot(deps));
  if (route === 'GET /api/damage') return sendJson(response, 200, deps.logistics.report());
  if (route === 'GET /api/briefing') {
    return sendJson(response, 200, await buildBriefing(situationFacts(deps.store, deps.team), deps.localModel));
  }
  if (url.pathname.startsWith('/api/env')) return sendJson(response, 200, await handleEnv(deps, route, request));
  if (route === 'POST /api/mode') {
    const body = await readJson(request);
    try {
      const mode = deps.mode.set(String(body.mode ?? ''));
      log.info({ mode }, '[Server] đổi chế độ');
      deps.bus.publish({ type: 'state' });
      return sendJson(response, 200, { mode });
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : String(error));
    }
  }
  const reportsMatch = request.method === 'GET' ? REPORTS_ROUTE.exec(url.pathname) : null;
  if (reportsMatch) {
    return serveReport(response, deps.workspace.projectDir(reportsMatch[1] ?? ''), decodeURIComponent(reportsMatch[2] ?? '/'));
  }
  if (route === 'GET /api/events') return streamEvents(deps.bus, request, response);
  if (route === 'POST /api/chat') {
    const body = await readJson(request);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) throw new HttpError(400, 'Tin nhắn trống');
    if (PASTED_SECRET.test(text)) throw new HttpError(400, 'Không dán token/khoá vào chat — dùng ô nhập token trong thẻ đổi tài khoản hoặc màn Env.');
    const projectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : null;
    const command = parseAccountCommand(text);
    if (command) {
      deps.store.addMessage('user', text, projectId);
      const reply = await deps.accounts.runCommand(command).catch((error: unknown) => (error instanceof Error ? error.message : String(error)));
      deps.store.addMessage('system', reply, projectId);
      deps.bus.publish({ type: 'state' });
      return sendJson(response, 202, { accepted: true, handledBy: 'ban-thong-tin' });
    }
    void deps.manager.consult({ sender: 'user', text, projectId });
    return sendJson(response, 202, { accepted: true });
  }
  if (url.pathname.startsWith('/api/accounts')) return sendJson(response, 200, await handleAccounts(deps, route, request));
  const projectAction = request.method === 'POST' ? PROJECT_ACTION.exec(url.pathname) : null;
  if (projectAction) return sendJson(response, 200, await handleProjectAction(deps, projectAction[1] ?? '', projectAction[2] ?? '', request));
  if (route === 'POST /api/queue/pause' || route === 'POST /api/queue/resume') {
    deps.quota.setManualPause(route.endsWith('pause'));
    deps.bus.publish({ type: 'state' });
    deps.scheduler.tick();
    return sendJson(response, 200, deps.quota.pauseState());
  }
  const eventsMatch = request.method === 'GET' ? TASK_EVENTS.exec(url.pathname) : null;
  if (eventsMatch) {
    return sendJson(response, 200, deps.store.taskEvents(Number(eventsMatch[1]), TASK_EVENT_LIMIT));
  }
  const actionMatch = request.method === 'POST' ? TASK_ACTION.exec(url.pathname) : null;
  if (actionMatch) return sendJson(response, 200, await runTaskAction(deps, request, actionMatch));
  throw new HttpError(404, `Không có route ${route}`);
}

/**
 * Duyệt / trả lại / thử lại / bỏ một task.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function runTaskAction(deps: ServerDeps, request: IncomingMessage, match: RegExpExecArray) {
  const taskId = Number(match[1]);
  const action = match[2];
  try {
    if (action === 'approve') return deps.scheduler.approve(taskId);
    if (action === 'retry') return deps.scheduler.retry(taskId);
    if (action === 'cancel') return deps.scheduler.cancel(taskId);
    const body = await readJson(request);
    if (action === 'answer') {
      const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
      if (!answer) throw new HttpError(400, 'Cần nhập câu trả lời');
      return deps.scheduler.answer(taskId, answer);
    }
    if (action === 'grant') {
      const tool = typeof body.tool === 'string' ? body.tool : '';
      if (!tool.trim()) throw new HttpError(400, 'Thiếu quyền cần cấp');
      return deps.scheduler.grant(taskId, tool);
    }
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
    if (!feedback) throw new HttpError(400, 'Cần ghi phản hồi khi trả lại');
    return deps.scheduler.reject(taskId, feedback);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, error instanceof Error ? error.message : String(error));
  }
}

/**
 * API đổi tài khoản Claude ngay trong chat: xem tình hình, chuyển tài khoản, nạp token tài
 * khoản phụ (lưu thẳng vào Keychain, bắn thử, đạt thì chuyển sang luôn).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
async function handleAccounts(deps: ServerDeps, route: string, request: IncomingMessage): Promise<unknown> {
  const { accounts } = deps;
  if (route === 'GET /api/accounts') return accounts.status();
  const body = await readJson(request);
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  try {
    if (route === 'POST /api/accounts/use') return await accounts.use(text('provider'));
    if (route === 'POST /api/accounts/token') {
      const token = text('token').replace(/\s+/g, '');
      if (token.length < MIN_TOKEN_LENGTH || !token.startsWith('sk-ant-')) {
        throw new HttpError(400, 'Token không hợp lệ — phải bắt đầu bằng sk-ant-…; terminal ngắt token thành 2 dòng, hãy chép cả 2 dòng.');
      }
      await deps.secrets.set(ALT_SECRET, token);
      log.info('[Server] đã lưu token tài khoản phụ vào Keychain');
      const check = await deps.router.test(ALT_ACCOUNT, deps.envTestDir);
      if (!check.ok) throw new HttpError(400, `Token đã lưu nhưng bắn thử chưa đạt: ${check.text}`);
      return await accounts.use(ALT_ACCOUNT);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, error instanceof Error ? error.message : String(error));
  }
  throw new HttpError(404, `Không có route ${route}`);
}

/**
 * API nơi lưu + git của một project (chỉ Chỉ huy trưởng gọi qua web): chuyển thư mục,
 * gắn remote, push tay, xoá project (thư mục vào Thùng rác).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
async function handleProjectAction(deps: ServerDeps, projectId: string, action: string, request: IncomingMessage): Promise<unknown> {
  const body = await readJson(request);
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');
  try {
    if (action === 'dir') return deps.projects.moveDir(projectId, text('dir'));
    if (action === 'remote') return deps.projects.setRemote(projectId, text('url'));
    if (action === 'delete') return await deps.projects.deleteProject(projectId, text('confirmName'));
    return await deps.projects.push(projectId);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : String(error));
  }
}

/**
 * API màn Env: xem nguồn (khoá chỉ hiện 4 ký tự cuối), ghi/xoá khoá vào Keychain, gán
 * nguồn cho ban, nguồn dự phòng, trần chi tiêu, bắn thử một nguồn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
async function handleEnv(deps: ServerDeps, route: string, request: IncomingMessage): Promise<unknown> {
  const { router, secrets } = deps;
  if (route === 'GET /api/env') return envSnapshot(deps);
  const body = await readJson(request);
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const secretNames = new Set(PROVIDERS.flatMap((provider) => (provider.secretName ? [provider.secretName] : [])));
  try {
    if (route === 'POST /api/env/secret') {
      if (!secretNames.has(text('name')) || !text('value')) throw new HttpError(400, 'Cần tên khoá hợp lệ và giá trị');
      await secrets.set(text('name'), text('value'));
    } else if (route === 'POST /api/env/secret/delete') {
      if (!secretNames.has(text('name'))) throw new HttpError(400, 'Tên khoá không hợp lệ');
      await secrets.remove(text('name'));
    } else if (route === 'POST /api/env/assign') {
      router.assign(text('role'), text('provider'), text('model'));
    } else if (route === 'POST /api/env/fallback') {
      router.setFallback(text('provider') || null);
    } else if (route === 'POST /api/env/cap') {
      router.setCap(Number(body.usd));
    } else if (route === 'POST /api/env/test') {
      return router.test(text('provider'), deps.envTestDir);
    } else {
      throw new HttpError(404, `Không có route ${route}`);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, error instanceof Error ? error.message : String(error));
  }
  deps.bus.publish({ type: 'state' });
  return envSnapshot(deps);
}

/**
 * Trạng thái màn Env: từng nguồn (có khoá chưa, gợi ý 4 ký tự, đăng nhập), gán theo ban, chi tiêu hôm nay.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
async function envSnapshot(deps: ServerDeps) {
  const [claude, codex, ollama] = await Promise.all([claudeLoginStatus(), codexLoginStatus(), ollamaStatus()]);
  const loginOf: Record<string, { ok: boolean; detail: string }> = { 'claude-main': claude, 'chatgpt-plus': codex };
  const providers = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const secret = provider.secretName ? await deps.secrets.get(provider.secretName) : null;
      const login = loginOf[provider.id];
      const status = login ?? { ok: !!secret, detail: secret ? 'đã có khoá' : 'chưa có khoá' };
      return { ...provider, hasSecret: !!secret, hint: secretHint(secret), status };
    }),
  );
  return {
    providers,
    ollama: { model: deps.localModel, status: ollama },
    assignments: deps.router.assignments(),
    fallback: deps.router.fallback(),
    capUsd: deps.router.capUsd(),
    spendToday: deps.router.spendToday(),
    roles: [...deps.team.values()].map((role) => ({ name: role.name, unit: role.unit, model: deps.mode.roleRun(role).model })),
  };
}

/**
 * Toàn bộ trạng thái cho web vẽ lại.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function snapshot(deps: ServerDeps) {
  const damage = deps.logistics.report();
  return {
    mode: deps.mode.current(),
    team: [...deps.team.values()].map((role) => {
      const run = deps.mode.roleRun(role);
      return { name: role.name, title: role.title, unit: role.unit, block: role.block, duty: role.duty, model: run.model, gate: role.gate };
    }),
    projects: deps.store.listProjects().map((project) => ({
      ...project,
      path: deps.workspace.projectDir(project.id),
      reports: listReports(deps.workspace.projectDir(project.id)),
    })),
    damage: { today: damage.today, byTask: damage.byTask, byRole: damage.byRole },
    tasks: deps.store.listTasks(),
    messages: deps.store.recentMessages(MESSAGE_LIMIT),
    quota: deps.quota.snapshot(),
    pause: deps.quota.pauseState(),
    runningTaskIds: deps.scheduler.runningTaskIds(),
    managerBusy: deps.manager.isBusy(),
  };
}

/**
 * Server-Sent Events: đẩy mọi sự kiện bus cho trình duyệt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function streamEvents(bus: FactoryBus, request: IncomingMessage, response: ServerResponse): void {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  response.write(': connected\n\n');
  const listener = (event: BusEvent) => response.write(`data: ${JSON.stringify(event)}\n\n`);
  const heartbeat = setInterval(() => response.write(': ping\n\n'), SSE_HEARTBEAT_MS);
  bus.on('event', listener);
  request.on('close', () => {
    clearInterval(heartbeat);
    bus.off('event', listener);
  });
}

/**
 * So token bằng thời gian hằng để tránh dò từng ký tự.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function isAuthorized(request: IncomingMessage, token: string): boolean {
  const provided = request.headers[TOKEN_HEADER];
  if (typeof provided !== 'string') return false;
  const expected = Buffer.from(token);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Đọc body JSON (tối đa 64KB).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Body quá lớn');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new HttpError(400, 'Body không phải JSON');
  }
}

/**
 * Trả JSON.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return;
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}
