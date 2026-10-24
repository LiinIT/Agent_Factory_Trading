import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { Manager, type ManagerInput } from '../src/manager.ts';
import { applyManagerActions } from '../src/manager-actions.ts';
import { Scheduler } from '../src/scheduler.ts';
import type { RunResult } from '../src/types.ts';
import { mkdirSync, writeFileSync } from 'node:fs';

import { singlePart } from '../src/bases.ts';
import type { RunCommand } from '../src/machine-check.ts';
import { fakeTeam, okResult, report, scriptedRunner, testEnvironment } from './helpers.ts';

const TASK = { projectId: 'demo', detail: 'làm', expected: 'đạt tiêu chí', verification: 'widget test 3 nền tảng' };

/**
 * Dựng Ban Thông tin với runner giả, ghi lại các lần báo Tham mưu trưởng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function schedulerWith(results: RunResult[]) {
  const environment = testEnvironment();
  const runner = scriptedRunner(results);
  const notifications: ManagerInput[] = [];
  const scheduler = new Scheduler({
    ...environment,
    team: fakeTeam(),
    runClaude: runner.run,
    notifyManager: (input) => notifications.push(input),
    concurrency: 1,
  });
  environment.workspace.create('demo', 'Demo', 'brief');
  environment.store.insertProject({ id: 'demo', name: 'Demo', brief: 'brief' });
  return { ...environment, scheduler, runner, notifications };
}

test('Tham mưu trưởng lập project + giao nhiệm vụ đủ kết quả mong muốn và cách thử', async () => {
  const environment = testEnvironment();
  const runner = scriptedRunner([
    okResult('', {
      reply: 'Báo cáo Chỉ huy trưởng: đã lập project. Không cần lệnh.',
      actions: [
        { type: 'create_project', name: 'Ghi chú chi tiêu', brief: 'App ghi chi tiêu cá nhân' },
        { type: 'create_task', role: 'tac-chien', title: 'Lập phương án', detail: 'Đọc brain/brief.md', expected: 'prd.md đủ tiêu chí', verification: 'Chỉ huy trưởng duyệt' },
        { type: 'create_task', role: 'xung-kich', title: 'Thiếu cách thử', detail: 'x' },
        { type: 'create_task', role: 'tham-muu-truong', title: 'Tự giao', detail: 'x', expected: 'x', verification: 'x' },
      ],
    }),
  ]);
  const manager = new Manager({ ...environment, team: fakeTeam(), runClaude: runner.run, timeoutMinutes: 1, historyLimit: 10 });

  await manager.consult({ sender: 'user', text: 'Làm app ghi chú chi tiêu' });

  const tasks = environment.store.listTasks('ghi-chu-chi-tieu');
  assert.deepEqual(tasks.map((task) => [task.role, task.title, task.gate, task.assignedBy, task.expected]), [
    ['tac-chien', 'Lập phương án', true, 'tham-muu-truong', 'prd.md đủ tiêu chí'],
  ]);
  const projectDir = environment.workspace.projectDir('ghi-chu-chi-tieu');
  assert.match(readFileSync(join(projectDir, 'brain/brief.md'), 'utf8'), /App ghi chi tiêu cá nhân/);
  assert.ok(existsSync(join(projectDir, '.claude/skills/demo/SKILL.md')));
  const rejected = environment.store.recentMessages(10).find((message) => message.text.startsWith('Bỏ qua'));
  assert.match(rejected?.text ?? '', /thiếu kết quả mong muốn/);
  assert.equal(environment.store.listRuns().length, 1);
  assert.equal(environment.store.listRuns()[0]?.role, 'tham-muu-truong');
});

test('applyManagerActions chống nhiệm vụ trùng và project không tồn tại', async () => {
  const { store } = testEnvironment();
  store.insertProject({ id: 'p', name: 'P', brief: 'b' });
  const context = { store, team: fakeTeam(), currentProjectId: 'p', createProject: () => 'never' };
  const action = { type: 'create_task', role: 'kiem-soat', title: 'Kiểm soát', detail: 'chạy test', expected: 'pass', verification: 'test' };
  assert.equal((await applyManagerActions([action], context)).createdTasks.length, 1);
  const second = await applyManagerActions([action, { ...action, title: 'Khác', projectId: 'khong-co' }], context);
  assert.equal(second.createdTasks.length, 0);
  assert.equal(second.rejected.length, 2);
});

test('nhiệm vụ urgent chen lên trước các nhiệm vụ đang chờ', () => {
  const { store } = testEnvironment();
  store.insertProject({ id: 'p', name: 'P', brief: 'b' });
  const base = { projectId: 'p', detail: 'd', gate: false };
  const first = store.insertTask({ ...base, role: 'xung-kich', title: 'Lát 1' });
  store.updateTask(first.id, { status: 'done' });
  store.insertTask({ ...base, role: 'xung-kich', title: 'Lát 2' });
  store.insertTask({ ...base, role: 'kiem-soat', title: 'Sửa lỗi', urgent: true });
  assert.deepEqual(store.listTasks('p').map((task) => task.title), ['Lát 1', 'Sửa lỗi', 'Lát 2']);
  assert.equal(store.nextRunnableTask()?.title, 'Sửa lỗi');
});

test('báo cáo JSON được lưu, chuyển về Tham mưu trưởng, có cổng thì chờ duyệt; duyệt xong chạy tiếp', async () => {
  const { store, scheduler, runner, notifications } = schedulerWith([okResult('xong', report('ĐẠT')), okResult('xong', report('ĐẠT'))]);
  const prd = store.insertTask({ ...TASK, role: 'tac-chien', title: 'Phương án', gate: true });
  const slice = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });

  scheduler.tick();
  await scheduler.idle();
  const afterPrd = store.requireTask(prd.id);
  assert.equal(afterPrd.status, 'awaiting_approval');
  assert.equal(afterPrd.report?.result, 'ĐẠT');
  assert.equal(afterPrd.model, 'claude-sonnet-5-5');
  assert.ok(runner.requests[0]?.jsonSchema);
  assert.match(runner.requests[0]?.prompt ?? '', /LỆNH GIAO NHIỆM VỤ/);
  assert.match(runner.requests[0]?.prompt ?? '', /widget test 3 nền tảng/);
  const reportMessage = store.recentMessages(20).find((message) => message.sender === 'report');
  assert.match(reportMessage?.text ?? '', /BÁO CÁO #\d+ · Ban tac-chien → Tham mưu trưởng/);
  assert.ok(store.recentMessages(20).some((message) => message.sender === 'logistics' && message.text.startsWith('THIỆT HẠI')));

  scheduler.approve(prd.id);
  assert.match(notifications.at(-1)?.text ?? '', /DUYỆT/);
  await scheduler.idle();
  assert.equal(store.requireTask(slice.id).status, 'done');
  assert.match(notifications.at(-1)?.text ?? '', /Hết nhiệm vụ/);
  assert.ok(store.recentMessages(30).some((message) => message.sender === 'logistics' && message.text.includes('TỔNG')));
});

test('ban gửi câu hỏi → chờ Chỉ huy trưởng trả lời → chạy tiếp phiên cũ kèm câu trả lời', async () => {
  const asking = okResult('cần hỏi', report('ĐẠT', { questions: ['Có cần đăng nhập không?'] }));
  const { store, scheduler, runner } = schedulerWith([asking, okResult('xong', report('ĐẠT'))]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });

  scheduler.tick();
  await scheduler.idle();
  const waiting = store.requireTask(task.id);
  assert.equal(waiting.status, 'awaiting_answer');
  assert.deepEqual(waiting.questions, ['Có cần đăng nhập không?']);
  assert.equal(waiting.report?.result, 'CẦN HỎI');

  scheduler.answer(task.id, 'Không cần đăng nhập');
  await scheduler.idle();
  assert.equal(runner.requests[1]?.resumeSessionId, 'session-1');
  assert.match(runner.requests[1]?.prompt ?? '', /Có cần đăng nhập không\?[\s\S]*Không cần đăng nhập/);
  assert.equal(store.requireTask(task.id).status, 'done');
});

test('trả lại nhiệm vụ thì chạy lại tiếp phiên cũ kèm phản hồi', async () => {
  const { store, scheduler, runner } = schedulerWith([okResult('v2', report('ĐẠT'))]);
  const prd = store.insertTask({ ...TASK, role: 'tac-chien', title: 'Phương án', gate: true });
  store.updateTask(prd.id, { status: 'awaiting_approval', sessionId: 'session-1' });

  scheduler.reject(prd.id, 'Bỏ tính năng đăng nhập');
  await scheduler.idle();

  assert.equal(runner.requests[0]?.resumeSessionId, 'session-1');
  assert.match(runner.requests[0]?.prompt ?? '', /Bỏ tính năng đăng nhập/);
  assert.equal(store.requireTask(prd.id).status, 'awaiting_approval');
  assert.equal(store.requireTask(prd.id).feedback, null);
});

test('hết quota: nhiệm vụ quay lại hàng đợi, hàng đợi tạm dừng, vẫn ghi thiệt hại', async () => {
  const limited: RunResult = { ...okResult("You've hit your limit"), ok: false, isUsageLimit: true };
  const { store, scheduler, quota } = schedulerWith([limited]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(store.requireTask(task.id).status, 'queued');
  assert.equal(quota.isPaused(), true);
  assert.equal(store.listRuns({ taskId: task.id }).length, 1);
});

test('nhiệm vụ lỗi chặn project và báo Tham mưu trưởng; thử lại thì chạy lại', async () => {
  const failed: RunResult = { ...okResult('flutter test thất bại'), ok: false };
  const { store, scheduler, notifications } = schedulerWith([failed, okResult('đã sửa', report('ĐẠT'))]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });
  store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm soát', gate: false });

  scheduler.tick();
  await scheduler.idle();
  assert.equal(store.requireTask(task.id).status, 'failed');
  assert.equal(store.nextRunnableTask(), undefined);
  assert.match(notifications.at(-1)?.text ?? '', /bị lỗi/);

  scheduler.retry(task.id);
  await scheduler.idle();
  assert.equal(store.requireTask(task.id).status, 'done');
});

test('vòng diệt lỗi: Kiểm soát KHÔNG ĐẠT → máy tự giao sửa + kiểm lại, chen lên trước, không gọi Tham mưu trưởng', async () => {
  const failing = okResult('lỗi', report('KHÔNG ĐẠT', { obstacles: 'nút lưu không chạy trên Android' }));
  const { store, scheduler, notifications } = schedulerWith([failing]);
  const check = store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm soát lát 1', gate: false });
  store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 2', gate: false });

  scheduler.tick();
  await new Promise((resolve) => setImmediate(resolve));
  scheduler.stop();
  await scheduler.idle();

  assert.equal(store.requireTask(check.id).status, 'done');
  assert.deepEqual(store.listTasks('demo').map((task) => [task.role, task.title]), [
    ['kiem-soat', 'Kiểm soát lát 1'],
    ['xung-kich', 'Diệt lỗi vòng 1: Kiểm soát lát 1'],
    ['kiem-soat', 'Kiểm lại vòng 1: Kiểm soát lát 1'],
    ['xung-kich', 'Lát 2'],
  ]);
  const fix = store.listTasks('demo')[1];
  assert.match(fix?.detail ?? '', /nút lưu không chạy trên Android/);
  assert.equal(fix?.assignedBy, 'ban-thong-tin');
  assert.equal(notifications.some((item) => /KHÔNG ĐẠT/.test(item.text)), false);
});

test('vòng diệt lỗi: vượt số vòng tối đa thì dừng và báo Tham mưu trưởng', async () => {
  const { store, scheduler, notifications } = schedulerWith([okResult('lỗi', report('KHÔNG ĐẠT'))]);
  scheduler.deps.bugLoopMaxRounds = 2;
  store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm lại vòng 2: Kiểm soát lát 1', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(store.listTasks('demo').length, 1);
  assert.match(notifications.at(-1)?.text ?? '', /Vượt 2 vòng diệt lỗi/);
});

test('Nghiệm thu: máy chạy trước toàn bộ barem; KHÔNG ĐẠT thì không chờ duyệt mà mở vòng diệt lỗi', async () => {
  const commands: string[] = [];
  const { store, scheduler, runner, workspace } = schedulerWith([okResult('chưa đạt', report('KHÔNG ĐẠT', { obstacles: 'A1 thiếu PrivacyInfo' }))]);
  scheduler.deps.base = {
    name: 'test',
    dir: '',
    exclude: [],
    parts: singlePart({ analyze: ['flutter', 'analyze'], test: ['flutter', 'test'], store_check: ['dart', 'run', 'tool/store_check.dart'], integration: ['flutter', 'test', 'integration_test', '-d', '{ios_simulator}'] }),
  };
  scheduler.deps.iosSimulator = 'SIM-1';
  scheduler.deps.runCheck = async (command) => {
    commands.push(command.join(' '));
    return command[1] === 'run' ? { ok: false, output: '[KHÔNG ĐẠT] A1 Thiếu PrivacyInfo' } : { ok: true, output: 'ok' };
  };
  writeFileSync(join(workspace.projectDir('demo'), 'pubspec.yaml'), 'name: app\n');
  const acceptance = store.insertTask({ ...TASK, role: 'nghiem-thu', title: 'Nghiệm thu tổng', gate: true });

  scheduler.tick();
  await new Promise((resolve) => setImmediate(resolve));
  scheduler.stop();
  await scheduler.idle();

  assert.deepEqual(commands, ['flutter analyze', 'flutter test', 'dart run tool/store_check.dart', 'flutter test integration_test -d SIM-1']);
  assert.match(runner.requests[0]?.prompt ?? '', /Bước "store_check" KHÔNG ĐẠT[\s\S]*Thiếu PrivacyInfo/);
  assert.equal(store.requireTask(acceptance.id).status, 'done');
  assert.ok(store.listTasks('demo').some((task) => task.title === 'Kiểm lại vòng 1: Nghiệm thu tổng' && task.role === 'nghiem-thu'));
});

/**
 * Sự kiện quota giả với mức dùng khung 5 giờ [utilization].
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function quotaEvent(utilization: number) {
  return { kind: 'quota' as const, quota: { status: 'allowed', fiveHour: { utilization, resetsAt: 1_900_000_000 }, sevenDay: null, updatedAt: Date.now() } };
}

test('Ban Hậu cần dừng nhiệm vụ khi quota 5h tăng quá ngưỡng 10% trong chính lượt chạy', async () => {
  const { store, scheduler } = schedulerWith([]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát nặng', gate: false });
  scheduler.deps.runClaude = (request) =>
    new Promise((resolvePromise) => {
      request.onEvent?.(quotaEvent(0.2));
      assert.equal(request.signal?.aborted, false);
      request.onEvent?.(quotaEvent(0.35));
      assert.equal(request.signal?.aborted, true);
      resolvePromise({ ...okResult(String(request.signal?.reason)), ok: false });
    });

  scheduler.tick();
  await scheduler.idle();
  const stopped = store.requireTask(task.id);
  assert.equal(stopped.status, 'failed');
  assert.match(stopped.error ?? '', /Ban Hậu cần báo động/);
  const [run] = store.listRuns({ taskId: task.id });
  assert.ok(Math.abs((run?.fiveHourDelta ?? 0) - 0.15) < 1e-9);
});

test('số quota đã lưu cũ (tài khoản bị dùng nơi khác) không bị tính cho nhiệm vụ, không dừng nhầm', async () => {
  const { store, scheduler, quota } = schedulerWith([]);
  quota.update({ status: 'allowed', fiveHour: { utilization: 0.2, resetsAt: 1_900_000_000 }, sevenDay: null, updatedAt: Date.now() });
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát nhẹ', gate: false });
  scheduler.deps.runClaude = async (request) => {
    request.onEvent?.(quotaEvent(0.8));
    request.onEvent?.(quotaEvent(0.82));
    assert.equal(request.signal?.aborted, false);
    return okResult('xong', report('ĐẠT'));
  };

  scheduler.tick();
  await scheduler.idle();
  assert.notEqual(store.requireTask(task.id).status, 'failed');
  const [run] = store.listRuns({ taskId: task.id });
  assert.ok(Math.abs((run?.fiveHourDelta ?? 0) - 0.02) < 1e-9);
});

test('task bị chặn quyền: lưu gợi ý, cấp quyền thì chạy lại với quyền mới', async () => {
  const blocked: RunResult = { ...okResult('không tải được', report('KHÔNG ĐẠT')), permissionDenials: ['Bash(curl *)'] };
  const { store, scheduler, runner } = schedulerWith([blocked, okResult('đã tải', report('ĐẠT'))]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Tải API', gate: false });

  scheduler.tick();
  await scheduler.idle();
  assert.deepEqual(store.requireTask(task.id).deniedTools, ['Bash(curl *)']);
  assert.throws(() => scheduler.grant(task.id, 'Bash(sudo *)'), /root/);

  scheduler.grant(task.id, 'Bash(curl *)');
  await scheduler.idle();
  assert.ok(runner.requests[1]?.allowedTools.includes('Bash(curl *)'));
  assert.equal(runner.requests[1]?.resumeSessionId, 'session-1');
  const finished = store.requireTask(task.id);
  assert.equal(finished.status, 'done');
  assert.deepEqual(finished.extraTools, ['Bash(curl *)']);
  assert.deepEqual(finished.deniedTools, []);
});

const BASE_COMMANDS = { setup: ['flutter', 'pub', 'get'], analyze: ['flutter', 'analyze'], test_quick: ['flutter', 'test', '--quick'] };

/**
 * Ban Thông tin ở chế độ Tà môn với lệnh máy giả và project có pubspec.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function taMonScheduler(results: RunResult[], runCheck: RunCommand) {
  const environment = schedulerWith(results);
  environment.mode.set('ta-mon');
  environment.scheduler.deps.base = { name: 'test', dir: '', exclude: [], parts: singlePart(BASE_COMMANDS) };
  environment.scheduler.deps.runCheck = runCheck;
  writeFileSync(join(environment.workspace.projectDir('demo'), 'pubspec.yaml'), 'name: app\n');
  return environment;
}

test('Tà môn: máy kiểm soát ĐẠT thì không gọi AI, báo cáo ĐẠT, thiệt hại 0 token', async () => {
  const commands: string[] = [];
  const { store, scheduler, runner } = taMonScheduler([], async (command) => {
    commands.push(command.join(' '));
    return { ok: true, output: 'ok' };
  });
  const task = store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm soát lát 1', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(runner.requests.length, 0);
  assert.deepEqual(commands, ['flutter pub get', 'flutter analyze', 'flutter test --quick']);
  const finished = store.requireTask(task.id);
  assert.equal(finished.status, 'done');
  assert.equal(finished.report?.result, 'ĐẠT');
  const [run] = store.listRuns({ taskId: task.id });
  assert.equal(run?.model, 'may-kiem-soat');
  assert.equal(run?.usage.cacheReadTokens, 0);
});

test('Tà môn: máy kiểm soát lỗi thì gọi AI (haiku, effort low) kèm log bước lỗi', async () => {
  const { store, scheduler, runner } = taMonScheduler([okResult('phân tích', report('KHÔNG ĐẠT'))], async (command) =>
    command[1] === 'analyze' ? { ok: false, output: 'error • Undefined name foo' } : { ok: true, output: 'ok' },
  );
  store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm soát lát 2', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(runner.requests[0]?.cwd.endsWith('workspace/demo'), true);
  assert.equal(runner.requests[0]?.model, 'haiku');
  assert.equal(runner.requests[0]?.effort, 'low');
  assert.match(runner.requests[0]?.prompt ?? '', /Bước "analyze" KHÔNG ĐẠT[\s\S]*Undefined name foo/);
  assert.match(runner.requests[0]?.systemPrompt ?? '', /TÀ MÔN[\s\S]*đọc lỗi máy/);
});

test('chế độ Chuẩn: dùng model của ban, system prompt kèm skill bắt buộc', async () => {
  const { store, scheduler, runner } = schedulerWith([okResult('xong', report('ĐẠT'))]);
  scheduler.deps.team.get('kiem-soat')!.skills.push('verification-loop');
  store.insertTask({ ...TASK, role: 'kiem-soat', title: 'Kiểm soát', gate: false });

  scheduler.tick();
  await scheduler.idle();

  assert.equal(runner.requests[0]?.model, 'sonnet');
  assert.equal(runner.requests[0]?.effort, undefined);
  assert.match(runner.requests[0]?.systemPrompt ?? '', /Skill bắt buộc[\s\S]*- verification-loop/);
});

test('project mới được dựng sẵn từ base barem, bỏ thư mục loại trừ', () => {
  const environment = testEnvironment();
  const baseDir = join(environment.root, 'base');
  mkdirSync(join(baseDir, 'lib'), { recursive: true });
  mkdirSync(join(baseDir, 'build'), { recursive: true });
  writeFileSync(join(baseDir, 'pubspec.yaml'), 'name: app\n');
  writeFileSync(join(baseDir, 'lib/main.dart'), 'void main() {}\n');
  writeFileSync(join(baseDir, 'build/rac.txt'), 'rác');
  environment.workspace.dirs.base = { name: 'test', dir: baseDir, exclude: ['build'], parts: [] };

  environment.workspace.create('moi', 'Mới', 'brief');

  const dir = environment.workspace.projectDir('moi');
  assert.ok(existsSync(join(dir, 'pubspec.yaml')));
  assert.ok(existsSync(join(dir, 'lib/main.dart')));
  assert.ok(existsSync(join(dir, 'CLAUDE.md')));
  assert.equal(existsSync(join(dir, 'build')), false);
});

test('ban báo CẦN HỎI mà không ghi câu hỏi: ban có cổng duyệt → chờ duyệt; ban khác → hỏi ý kiến về đề xuất', async () => {
  const asking = (proposal: string) => okResult('', report('CẦN HỎI', { questions: [], proposal }));
  const gatedEnv = schedulerWith([asking('Thủ trưởng mở design/index.html để duyệt')]);
  const gated = gatedEnv.store.insertTask({ ...TASK, role: 'tac-chien', title: 'Phương án', gate: true });
  gatedEnv.scheduler.tick();
  await gatedEnv.scheduler.idle();
  assert.equal(gatedEnv.store.requireTask(gated.id).status, 'awaiting_approval');
  assert.deepEqual(gatedEnv.store.requireTask(gated.id).questions, []);

  const plainEnv = schedulerWith([asking('Dùng thư viện intl để định dạng tiền')]);
  const plain = plainEnv.store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });
  plainEnv.scheduler.tick();
  await plainEnv.scheduler.idle();
  assert.equal(plainEnv.store.requireTask(plain.id).status, 'awaiting_answer');
  assert.deepEqual(plainEnv.store.requireTask(plain.id).questions, ['Ban xin ý kiến: Dùng thư viện intl để định dạng tiền [Đồng ý | Không đồng ý]']);
});

test('quyền bị cấm (vd Bash(cd *)) không đưa Chỉ huy trưởng xét, chỉ ghi nhật ký', async () => {
  const denied: RunResult = { ...okResult('xong', report('ĐẠT')), permissionDenials: ['Bash(cd *)', 'Bash(flutter *)'] };
  const { store, scheduler } = schedulerWith([denied]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });
  scheduler.tick();
  await scheduler.idle();
  assert.deepEqual(store.requireTask(task.id).deniedTools, ['Bash(flutter *)']);
  assert.ok(store.taskEvents(task.id, 50).some((event) => /chặn hẳn.*Bash\(cd \*\)/.test(event.text)));
});

test('quyền vai đã có mà vẫn bị chặn (do nối nhiều lệnh) không đưa Chỉ huy trưởng xét', async () => {
  const denied: RunResult = { ...okResult('xong', report('ĐẠT')), permissionDenials: ['Read'] };
  const { store, scheduler } = schedulerWith([denied]);
  const task = store.insertTask({ ...TASK, role: 'xung-kich', title: 'Lát 1', gate: false });
  scheduler.tick();
  await scheduler.idle();
  assert.deepEqual(store.requireTask(task.id).deniedTools, []);
  assert.ok(store.taskEvents(task.id, 50).some((event) => /nối nhiều lệnh/.test(event.text)));
});
