import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import type { EaConfig, Exec } from '../src/ea-runner.ts';
import type { ManagerInput } from '../src/manager.ts';
import { Scheduler } from '../src/scheduler.ts';
import type { RoleDefinition, RunResult } from '../src/types.ts';
import { fakeTeam, okResult, report, role, scriptedRunner, testEnvironment } from './helpers.ts';

const TASK = { projectId: 'demo', detail: 'làm', expected: 'đạt', verification: 'compile' };
const PLAN = { expert: 'bot', runs: [{ id: 'r1', symbol: 'XAUUSDm', period: 'H1', from: '2026.01.05', to: '2026.02.05', delay: 'none' }] };

/**
 * Mã hóa UTF-16 LE có BOM như log MT5.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function utf16(text: string): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
}

/**
 * Ban Thông tin có cấu hình EA giả, repo gốc DV2 tạm (để chụp ảnh thay đổi) và wine giả biên dịch theo [compileLog].
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function eaScheduler(results: RunResult[], compileLog = 'Result: 0 errors, 0 warnings\n') {
  const environment = testEnvironment();
  const mt5Dir = join(environment.root, 'mt5bt');
  const factoryRoot = join(environment.root, 'factory');
  mkdirSync(mt5Dir, { recursive: true });
  mkdirSync(join(factoryRoot, 'brain/ea'), { recursive: true });
  writeFileSync(join(factoryRoot, 'brain/ea/README.md'), 'x\n');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: factoryRoot });
  execFileSync('git', ['add', '-A'], { cwd: factoryRoot });
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'i'], { cwd: factoryRoot });
  const ea: EaConfig = { mt5Dir, winePrefix: '', wineApp: join(environment.root, 'wine'), maxTesterRunsPerRound: 12, testerTimeoutMinutes: 1 };
  const calls: string[][] = [];
  const exec: Exec = async (_file, args) => {
    calls.push(args);
    const logName = (args.find((item) => item.startsWith('/log:')) ?? '').slice(5);
    if (logName) writeFileSync(join(mt5Dir, logName), utf16(compileLog));
    return { code: 0, stdout: '', stderr: '' };
  };
  const runner = scriptedRunner(results);
  const notifications: ManagerInput[] = [];
  const team = fakeTeam();
  const scheduler = new Scheduler({
    ...environment,
    team,
    runClaude: runner.run,
    notifyManager: (input) => notifications.push(input),
    concurrency: 1,
    ea,
    exec,
    factoryRoot,
  });
  environment.workspace.create('demo', 'Demo', 'brief');
  environment.store.insertProject({ id: 'demo', name: 'Demo', brief: 'brief' });
  const projectDir = environment.workspace.projectDir('demo');
  return { ...environment, scheduler, runner, notifications, team, calls, projectDir, factoryRoot };
}

/**
 * Thêm vai [name] vào biên chế giả với vùng ghi [writes].
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function addRole(team: Map<string, RoleDefinition>, name: string, writes: string[]): void {
  team.set(name, { ...role(name), writes });
}

test('Dựng bàn thử: máy sinh ini, không gọi AI, báo cáo ĐẠT, 0 token', async () => {
  const { store, scheduler, runner, team, projectDir } = eaScheduler([]);
  addRole(team, 'ea-dung-ban-thu', ['results/']);
  mkdirSync(join(projectDir, 'ea'), { recursive: true });
  mkdirSync(join(projectDir, 'brain'), { recursive: true });
  writeFileSync(join(projectDir, 'ea/bot.mq5'), 'input double InpLots = 0.02;\n');
  writeFileSync(join(projectDir, 'brain/test-plan.json'), JSON.stringify(PLAN));
  const task = store.insertTask({ ...TASK, role: 'ea-dung-ban-thu', title: 'Dựng bàn thử', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(runner.requests.length, 0);
  const finished = store.requireTask(task.id);
  assert.equal(finished.status, 'done');
  assert.equal(finished.report?.result, 'ĐẠT');
  assert.match(finished.report?.evidence ?? '', /Đã dựng 1 file ini \(vốn 1000, real ticks\): r1/);
  const [run] = store.listRuns({ taskId: task.id });
  assert.equal(run?.model, 'may-ea');
  assert.equal(run?.usage.outputTokens, 0);
});

test('Dựng bàn thử: kế hoạch lỗi → KHÔNG ĐẠT, báo Tham mưu trưởng (không chạy gì)', async () => {
  const { store, scheduler, team, notifications } = eaScheduler([]);
  addRole(team, 'ea-dung-ban-thu', ['results/']);
  const task = store.insertTask({ ...TASK, role: 'ea-dung-ban-thu', title: 'Dựng bàn thử', gate: false });

  scheduler.tick();
  await scheduler.idle();

  const finished = store.requireTask(task.id);
  assert.equal(finished.report?.result, 'KHÔNG ĐẠT');
  assert.match(finished.report?.obstacles ?? '', /Thiếu brain\/test-plan\.json/);
  assert.match(notifications.at(-1)?.text ?? '', /KHÔNG ĐẠT/);
});

test('Chế tạo báo ĐẠT nhưng máy biên dịch lại thấy lỗi → báo cáo bị đổi thành KHÔNG ĐẠT kèm log', async () => {
  const { store, scheduler, team, projectDir, notifications } = eaScheduler([okResult('xong', report('ĐẠT'))], 'bot.mq5(5,1) : error 100: bad\nResult: 1 errors, 0 warnings\n');
  addRole(team, 'ea-che-tao', ['ea/', 'brain/']);
  const runner = scriptedRunner([okResult('xong', report('ĐẠT'))]);
  scheduler.deps.runClaude = async (request) => {
    mkdirSync(join(projectDir, 'ea'), { recursive: true });
    writeFileSync(join(projectDir, 'ea/bot.mq5'), 'void OnTick(){}\n');
    return runner.run(request);
  };
  const task = store.insertTask({ ...TASK, role: 'ea-che-tao', title: 'Viết EA', gate: false });

  scheduler.tick();
  await scheduler.idle();

  const finished = store.requireTask(task.id);
  assert.equal(finished.report?.result, 'KHÔNG ĐẠT');
  assert.match(finished.report?.obstacles ?? '', /biên dịch lại và KHÔNG sạch[\s\S]*error 100/);
  assert.match(notifications.at(-1)?.text ?? '', /KHÔNG ĐẠT/);
});

test('Chế tạo báo ĐẠT và máy biên dịch sạch → giữ ĐẠT, commit mã', async () => {
  const { store, scheduler, team, projectDir, calls } = eaScheduler([]);
  addRole(team, 'ea-che-tao', ['ea/', 'brain/']);
  const runner = scriptedRunner([okResult('xong', report('ĐẠT'))]);
  scheduler.deps.runClaude = async (request) => {
    mkdirSync(join(projectDir, 'ea'), { recursive: true });
    writeFileSync(join(projectDir, 'ea/bot.mq5'), 'void OnTick(){}\n');
    return runner.run(request);
  };
  const task = store.insertTask({ ...TASK, role: 'ea-che-tao', title: 'Viết EA', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(store.requireTask(task.id).report?.result, 'ĐẠT');
  assert.equal(calls.filter((args) => args[0] === 'MetaEditor64.exe').length, 1);
  const log = execFileSync('git', ['log', '--format=%s'], { cwd: projectDir, encoding: 'utf8' });
  assert.match(log, /^feat\(ea-che-tao\): Viết EA/m);
});

test('Ban ghi ngoài vùng được phép → nhiệm vụ lỗi, không commit, báo Tham mưu trưởng', async () => {
  const { store, scheduler, team, projectDir, notifications } = eaScheduler([]);
  addRole(team, 'ea-nghien-cuu', ['brain/']);
  const runner = scriptedRunner([okResult('xong', report('ĐẠT'))]);
  scheduler.deps.runClaude = async (request) => {
    mkdirSync(join(projectDir, 'ea'), { recursive: true });
    writeFileSync(join(projectDir, 'ea/lan-rank.mq5'), 'code lẽ ra không được viết\n');
    writeFileSync(join(projectDir, 'brain/hypothesis.md'), 'hợp lệ\n');
    return runner.run(request);
  };
  const task = store.insertTask({ ...TASK, role: 'ea-nghien-cuu', title: 'Giả thuyết', gate: false });
  const before = execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: projectDir, encoding: 'utf8' });

  scheduler.tick();
  await scheduler.idle();

  const failed = store.requireTask(task.id);
  assert.equal(failed.status, 'failed');
  assert.match(failed.error ?? '', /ghi ngoài vùng được phép \(brain\/\): ea\/lan-rank\.mq5/);
  assert.equal(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: projectDir, encoding: 'utf8' }), before);
  assert.match(notifications.at(-1)?.text ?? '', /ghi ngoài vùng/);
});

test('Ban ghi vào bộ não chung qua brain-ea/ đúng vùng thì qua; ghi kho khác thì bị chặn', async () => {
  const { store, scheduler, team, factoryRoot } = eaScheduler([]);
  addRole(team, 'ea-trinh-sat', ['brain-ea/scouting/']);
  const runner = scriptedRunner([okResult('ok', report('ĐẠT')), okResult('ok', report('ĐẠT'))]);
  let target = 'brain/ea/scouting/a.md';
  scheduler.deps.runClaude = async (request) => {
    mkdirSync(join(factoryRoot, 'brain/ea/scouting'), { recursive: true });
    mkdirSync(join(factoryRoot, 'brain/ea/patterns'), { recursive: true });
    writeFileSync(join(factoryRoot, target), 'thẻ\n');
    return runner.run(request);
  };
  const good = store.insertTask({ ...TASK, role: 'ea-trinh-sat', title: 'Tìm bot A', gate: false });
  scheduler.tick();
  await scheduler.idle();
  assert.equal(store.requireTask(good.id).status, 'done');

  target = 'brain/ea/patterns/x.md';
  const bad = store.insertTask({ ...TASK, role: 'ea-trinh-sat', title: 'Tìm bot B', gate: false });
  scheduler.tick();
  await scheduler.idle();
  assert.equal(store.requireTask(bad.id).status, 'failed');
  assert.match(store.requireTask(bad.id).error ?? '', /brain-ea\/patterns\/x\.md/);
});

test('Soát mã KHÔNG ĐẠT mở vòng sửa giao Ban Chế tạo (không phải Xung kích) rồi soát lại', async () => {
  const { store, scheduler, team } = eaScheduler([okResult('lỗi', report('KHÔNG ĐẠT', { obstacles: 'ea/bot.mq5:42 đọc nến đang hình thành' }))]);
  addRole(team, 'ea-soat-ma', ['brain/code-review.md']);
  store.insertTask({ ...TASK, role: 'ea-soat-ma', title: 'Soát mã bot', gate: false });

  scheduler.tick();
  await scheduler.idle();
  scheduler.stop();

  const tasks = store.listTasks('demo').map((item) => [item.role, item.title]);
  assert.deepEqual(tasks, [
    ['ea-soat-ma', 'Soát mã bot'],
    ['ea-che-tao', 'Diệt lỗi vòng 1: Soát mã bot'],
    ['ea-soat-ma', 'Kiểm lại vòng 1: Soát mã bot'],
  ]);
  const fix = store.listTasks('demo')[1];
  assert.match(fix?.detail ?? '', /ea\/bot\.mq5:42/);
  assert.match(fix?.verification ?? '', /\.\/dv2 compile/);
});
