import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { FactoryBus } from './bus.ts';
import { killAllClaude, runClaude } from './claude-runner.ts';
import { loadConfig, ROOT_DIR } from './config.ts';
import { loadDefaultBase } from './bases.ts';
import { Logistics } from './logistics.ts';
import { log } from './logger.ts';
import { Manager } from './manager.ts';
import { runCodex } from './codex-runner.ts';
import { ProviderRouter } from './providers.ts';
import { keychainStore } from './secrets.ts';
import { ModeState } from './mode.ts';
import { QuotaState } from './quota-state.ts';
import { AccountDesk } from './accounts.ts';
import { ProjectDesk } from './projects.ts';
import { Scheduler } from './scheduler.ts';
import { resolveIosSimulator } from './simulator.ts';
import { createApiServer } from './server.ts';
import { FactoryStore } from './store.ts';
import { loadTeam } from './team.ts';
import { Workspace } from './workspace.ts';

const TICK_INTERVAL_MS = 5_000;
const TOKEN_BYTES = 24;
const HEALTH_TIMEOUT_MS = 1_500;

/**
 * Đọc token API trong `data/token`; chưa có thì tạo ngẫu nhiên (quyền 600).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function loadOrCreateToken(dataDir: string): string {
  const path = join(dataDir, 'token');
  if (existsSync(path)) return readFileSync(path, 'utf8').trim();
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  writeFileSync(path, `${token}\n`, { mode: 0o600 });
  return token;
}

/**
 * Đã có orchestrator trả lời ở [host]:[port] chưa — kiểm trước khi đụng tới DB để bản chạy
 * thừa không đưa nhiệm vụ của bản đang chạy về hàng đợi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
async function isAlreadyRunning(host: string, port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Khởi động toàn bộ hệ thống: DB, đội, quản lý, hàng đợi, HTTP API.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function main(): Promise<void> {
  const config = loadConfig();
  if (await isAlreadyRunning(config.host, config.port)) {
    log.error({ port: config.port }, `[Main] đã có orchestrator đang chạy ở cổng ${config.port} — không khởi động thêm. Muốn chạy bản mới: npm run restart`);
    process.exit(1);
  }
  mkdirSync(config.dataDir, { recursive: true });
  mkdirSync(config.workspaceDir, { recursive: true });

  const store = new FactoryStore(join(config.dataDir, 'factory.db'));
  const recovered = store.recoverInterruptedTasks();
  if (recovered > 0) log.warn({ recovered }, '[Main] đưa task bị ngắt về hàng đợi');

  const team = loadTeam(config.teamDir);
  const bus = new FactoryBus();
  const quota = new QuotaState(store, config.quota);
  const logistics = new Logistics(store, config.quota.alarmFiveHourDeltaPerTask ?? Number.POSITIVE_INFINITY);
  const mode = new ModeState(store, config.modes);
  const base = loadDefaultBase(config.basesDir);
  const router = new ProviderRouter({
    store,
    secrets: keychainStore,
    quota,
    engines: { claude: runClaude, codex: runCodex },
    defaultCapUsd: config.spendCapUsd,
    openAiPricePerMillion: config.openAiPricePerMillion,
  });
  quota.setSources(() => router.sourcesInUse());
  const envTestDir = join(config.dataDir, 'env-test');
  mkdirSync(envTestDir, { recursive: true });
  if (!base) log.warn('[Main] không tìm thấy base barem — project mới sẽ không có khung sẵn');
  const workspace = new Workspace({
    workspaceDir: config.workspaceDir,
    templateDir: config.templateDir,
    skillsDir: config.skillsDir,
    base,
    projectPath: (projectId) => store.getProject(projectId)?.dir ?? null,
  });
  const projects = new ProjectDesk({ store, workspace, bus, rules: { home: homedir(), factoryRoot: ROOT_DIR } });
  const manager = new Manager({
    store,
    team,
    runClaude: router.run,
    bus,
    workspace,
    quota,
    logistics,
    mode,
    timeoutMinutes: config.managerTimeoutMinutes,
    historyLimit: config.managerHistoryLimit,
    resolveDir: projects.resolveDir,
    projectOps: {
      cancelTask: (taskId) => void scheduler.cancel(taskId),
      cleanGenerated: (projectId) => projects.cleanGenerated(projectId),
      applyBase: (projectId) => projects.applyBase(projectId),
    },
  });
  const scheduler = new Scheduler({
    store,
    team,
    runClaude: router.run,
    bus,
    workspace,
    quota,
    logistics,
    mode,
    base,
    iosSimulator: resolveIosSimulator(),
    bugLoopMaxRounds: config.bugLoop.maxRounds,
    notifyManager: (input) => void manager.consult(input),
    canRunRole: (role) => router.canRun(role),
    concurrency: config.concurrency,
  });

  const accounts = new AccountDesk({ router, quota, secrets: keychainStore, manager, bus, tickScheduler: () => scheduler.tick() });

  const server = createApiServer({
    store,
    scheduler,
    manager,
    accounts,
    projects,
    quota,
    bus,
    logistics,
    mode,
    localModel: config.localModel,
    router,
    secrets: keychainStore,
    envTestDir,
    workspace,
    team,
    token: loadOrCreateToken(config.dataDir),
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') log.error({ port: config.port }, `[Main] cổng ${config.port} đã bị chiếm — chạy npm run restart`);
    else log.error({ err: error }, '[Main] lỗi server');
    process.exit(1);
  });
  server.listen(config.port, config.host, () => {
    log.info({ url: `http://${config.host}:${config.port}`, roles: [...team.keys()] }, '[Main] orchestrator sẵn sàng');
    scheduler.start(TICK_INTERVAL_MS);
  });

  const shutdown = (signal: string) => {
    log.info({ signal }, '[Main] đang tắt');
    scheduler.stop();
    killAllClaude();
    server.close();
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void main();
