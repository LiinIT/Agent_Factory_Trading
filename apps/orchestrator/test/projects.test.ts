import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { singlePart } from '../src/bases.ts';
import { applyManagerActions, type ProjectOps } from '../src/manager-actions.ts';
import { resolveProjectDir, validateGitRemote, type LocationRules } from '../src/project-location.ts';
import { ProjectDesk, scanRepo } from '../src/projects.ts';
import { Workspace } from '../src/workspace.ts';
import { fakeTeam, testEnvironment } from './helpers.ts';

/**
 * Quy tắc nơi lưu trong thư mục tạm (bỏ danh sách thư mục hệ thống vì tmp nằm trong /var).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function tempRules(): LocationRules & { root: string } {
  const root = mkdtempSync(join(tmpdir(), 'factory-location-'));
  mkdirSync(join(root, 'home/Documents'), { recursive: true });
  mkdirSync(join(root, 'agent-factory'), { recursive: true });
  return { root, home: join(root, 'home'), factoryRoot: join(root, 'agent-factory'), blockedDirs: [] };
}

/**
 * Môi trường có một project mặc định và Ban quản lý project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function deskWithProject(moveToTrash?: (path: string) => Promise<void>) {
  const environment = testEnvironment();
  const rules = tempRules();
  environment.workspace.create('demo', 'Demo', 'brief');
  environment.store.insertProject({ id: 'demo', name: 'Demo', brief: 'brief' });
  const desk = new ProjectDesk({ store: environment.store, workspace: environment.workspace, bus: environment.bus, rules, moveToTrash });
  return { ...environment, rules, desk };
}

test('resolveProjectDir mở rộng ~/, chặn đường dẫn tương đối, thư mục nhà, repo agent-factory', () => {
  const rules = tempRules();
  assert.equal(resolveProjectDir('~/Documents/app-moi', rules), join(rules.home, 'Documents/app-moi'));
  assert.throws(() => resolveProjectDir('Documents/app', rules), /tuyệt đối/);
  assert.throws(() => resolveProjectDir('~', rules), /chọn một thư mục con/);
  assert.throws(() => resolveProjectDir(join(rules.factoryRoot, 'x'), rules), /repo agent-factory/);
  assert.throws(() => resolveProjectDir('~/khong-co/app', rules), /chưa có/);
  writeFileSync(join(rules.home, 'Documents/ghi-chu.txt'), 'x');
  assert.throws(() => resolveProjectDir('~/Documents', rules), /đã có dữ liệu/);
  assert.throws(() => resolveProjectDir('/usr/local/app', { ...rules, blockedDirs: undefined }), /Không lưu project/);
});

test('validateGitRemote nhận https/ssh chuẩn, chặn token trong URL', () => {
  assert.equal(validateGitRemote(' git@github.com:mia/app.git '), 'git@github.com:mia/app.git');
  assert.equal(validateGitRemote('https://github.com/mia/app.git'), 'https://github.com/mia/app.git');
  assert.throws(() => validateGitRemote('https://mia:ghp_abc@github.com/mia/app.git'), /Không ghi tài khoản/);
  assert.throws(() => validateGitRemote('--upload-pack=evil'), /không hợp lệ/);
  assert.throws(() => validateGitRemote('/Users/mia/repo'), /không hợp lệ/);
});

test('chuyển nơi lưu: chép cả repo sang thư mục mới, xoá phiên agent cũ, về lại mặc định được', () => {
  const { desk, store, workspace, rules } = deskWithProject();
  const task = store.insertTask({ projectId: 'demo', role: 'xung-kich', title: 'Lát 1', detail: 'làm', gate: false, expected: 'x', verification: 'y' });
  store.updateTask(task.id, { sessionId: 'phien-cu', status: 'done' });
  const oldDir = workspace.projectDir('demo');

  desk.moveDir('demo', '~/Documents/demo-app');

  const newDir = join(rules.home, 'Documents/demo-app');
  assert.equal(workspace.projectDir('demo'), newDir);
  assert.equal(existsSync(join(newDir, '.git')), true);
  assert.equal(existsSync(oldDir), false);
  assert.equal(store.requireTask(task.id).sessionId, null);
  desk.moveDir('demo', '');
  assert.equal(workspace.projectDir('demo'), oldDir);
  assert.equal(store.getProject('demo')?.dir, null);
});

test('không chuyển nơi lưu / push khi project đang có nhiệm vụ chạy', async () => {
  const { desk, store } = deskWithProject();
  const task = store.insertTask({ projectId: 'demo', role: 'xung-kich', title: 'Lát 1', detail: 'làm', gate: false, expected: 'x', verification: 'y' });
  store.updateTask(task.id, { status: 'running' });
  assert.throws(() => desk.moveDir('demo', '~/Documents/demo-app'), /đang có nhiệm vụ chạy/);
  desk.setRemote('demo', 'git@github.com:mia/demo.git');
  await assert.rejects(desk.push('demo'), /đang có nhiệm vụ chạy/);
});

test('gắn / gỡ git remote origin', () => {
  const { desk, workspace } = deskWithProject();
  const dir = workspace.projectDir('demo');
  desk.setRemote('demo', 'git@github.com:mia/demo.git');
  assert.equal(execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: dir, encoding: 'utf8' }).trim(), 'git@github.com:mia/demo.git');
  desk.setRemote('demo', 'https://github.com/mia/demo2.git');
  assert.equal(execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: dir, encoding: 'utf8' }).trim(), 'https://github.com/mia/demo2.git');
  desk.setRemote('demo', '');
  assert.equal(execFileSync('git', ['remote'], { cwd: dir, encoding: 'utf8' }).trim(), '');
});

test('push bị chặn khi repo có key, không gửi gì ra mạng', async () => {
  const { desk, workspace } = deskWithProject();
  desk.setRemote('demo', 'git@github.com:mia/demo.git');
  const fakeKey = `sk-ant-api03-${'X'.repeat(40)}`;
  writeFileSync(join(workspace.projectDir('demo'), 'config.dart'), `const key = '${fakeKey}';\n`);
  workspace.commitAll('demo', 'feat: thêm cấu hình');
  const result = await desk.push('demo');
  assert.equal(result.ok, false);
  assert.match(result.output, /Chặn push: tìm thấy 1 bí mật/);
  assert.match(result.output, /config\.dart:1 {2}Anthropic key\/token {2}sk-ant…/);
  assert.doesNotMatch(result.output, /XXXXXXXXXX/);
});

test('Tham mưu trưởng lập project kèm nơi lưu; nơi lưu sai thì lập ở mặc định và báo lý do', async () => {
  const { store, rules } = deskWithProject();
  const created: (string | undefined)[] = [];
  const context = {
    store,
    team: fakeTeam(),
    currentProjectId: null,
    createProject: (_name: string, _brief: string, dir?: string) => {
      created.push(dir);
      return 'p';
    },
    resolveDir: (input: string) => resolveProjectDir(input, rules),
  };
  const outcome = await applyManagerActions(
    [
      { type: 'create_project', name: 'A', brief: 'a', dir: '~/Documents/app-a' },
      { type: 'create_project', name: 'B', brief: 'b', dir: 'tuong-doi/app-b' },
    ],
    context,
  );
  assert.deepEqual(created, [join(rules.home, 'Documents/app-a'), undefined]);
  assert.match(outcome.rejected[0] ?? '', /nơi lưu "tuong-doi\/app-b" không dùng được .* đã lập ở nơi mặc định/);
});

test('project mới có thư mục setups/ (hồ sơ lên store) từ template thật, sạch key, đã commit', () => {
  const root = mkdtempSync(join(tmpdir(), 'factory-setups-'));
  const factoryRoot = join(import.meta.dirname, '../../..');
  const workspace = new Workspace({ workspaceDir: root, templateDir: join(factoryRoot, 'templates/project'), skillsDir: join(factoryRoot, 'skills') });
  workspace.create('app', 'App', 'brief');
  const dir = workspace.projectDir('app');
  for (const file of ['README.md', 'store-tasks.md', 'listing/vi.md', 'screenshots/README.md', 'icon/brief.md', 'privacy/data-safety.md', 'review-notes.md']) {
    assert.equal(existsSync(join(dir, 'setups', file)), true, file);
  }
  const tracked = execFileSync('git', ['ls-files', 'setups'], { cwd: dir, encoding: 'utf8' });
  assert.match(tracked, /setups\/store-tasks\.md/);
  assert.deepEqual(scanRepo(dir), []);
});

test('xoá project: gõ đúng tên, thư mục vào Thùng rác, gỡ nhiệm vụ + tin nhắn, giữ lịch sử thiệt hại', async () => {
  const trash = mkdtempSync(join(tmpdir(), 'factory-trash-'));
  const { desk, store, workspace } = deskWithProject(async (path) => renameSync(path, join(trash, 'demo')));
  const dir = workspace.projectDir('demo');
  const task = store.insertTask({ projectId: 'demo', role: 'tac-chien', title: 'Phương án', detail: 'làm', gate: true, expected: 'x', verification: 'y' });
  store.addTaskEvent(task.id, 'system', 'bắt đầu');
  store.addMessage('user', 'làm app', 'demo');
  store.insertRun({
    taskId: task.id, projectId: 'demo', role: 'tac-chien', model: 'sonnet', ok: true, startedAt: new Date().toISOString(), durationMs: 1,
    usage: { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 }, costUsd: 0.1, fiveHourDelta: null, sevenDayDelta: null, denials: 0,
  });
  store.setSetting('manager_pending_retry', { sender: 'user', text: 'làm app', projectId: 'demo' });

  await assert.rejects(desk.deleteProject('demo', 'demo app'), /Gõ đúng tên project "Demo"/);
  assert.ok(store.getProject('demo'));

  const result = await desk.deleteProject('demo', ' Demo ');
  assert.deepEqual(result, { deleted: 'demo', trashed: dir });
  assert.equal(existsSync(dir), false);
  assert.equal(existsSync(join(trash, 'demo', '.git')), true);
  assert.equal(store.getProject('demo'), undefined);
  assert.deepEqual(store.listTasks('demo'), []);
  assert.equal(store.recentMessages(10).some((message) => message.projectId === 'demo'), false);
  assert.equal(store.listRuns().length, 1);
  assert.equal(store.getSetting('manager_pending_retry', null), null);
});

test('xoá project bị chặn khi có nhiệm vụ chạy; Thùng rác lỗi thì DB giữ nguyên', async () => {
  const running = deskWithProject(async () => undefined);
  const task = running.store.insertTask({ projectId: 'demo', role: 'xung-kich', title: 'Lát 1', detail: 'làm', gate: false, expected: 'x', verification: 'y' });
  running.store.updateTask(task.id, { status: 'running' });
  await assert.rejects(running.desk.deleteProject('demo', 'Demo'), /đang có nhiệm vụ chạy/);

  const failing = deskWithProject(async () => {
    throw new Error('Không chuyển được vào Thùng rác');
  });
  await assert.rejects(failing.desk.deleteProject('demo', 'Demo'), /Thùng rác/);
  assert.ok(failing.store.getProject('demo'));
  assert.equal(existsSync(failing.workspace.projectDir('demo')), true);
});

/**
 * Ghi [files] (đường dẫn tương đối → nội dung) vào [dir].
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

test('dọn file sinh tự động: chỉ mục trong danh sách; mục lỡ commit thì gỡ khỏi git + .gitignore trước; vào Thùng rác', async () => {
  const trashed: string[] = [];
  const { desk, workspace } = deskWithProject(async (path) => {
    trashed.push(path);
  });
  const dir = workspace.projectDir('demo');
  writeFiles(dir, { 'build/a.txt': 'lỡ commit', '.dart_tool/b': 'x', 'app.iml': 'x', 'lib/main.dart': 'void main() {}' });
  execFileSync('git', ['add', '-f', 'build/a.txt', 'lib/main.dart'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'lỡ commit build'], { cwd: dir });

  const cleaned = await desk.cleanGenerated('demo');

  assert.deepEqual([...cleaned].sort(), ['.dart_tool', 'app.iml', 'build']);
  assert.deepEqual([...trashed].sort(), ['.dart_tool', 'app.iml', 'build'].map((name) => join(dir, name)));
  const tracked = execFileSync('git', ['ls-files'], { cwd: dir, encoding: 'utf8' });
  assert.doesNotMatch(tracked, /^build\//m);
  assert.match(tracked, /^lib\/main\.dart$/m);
  assert.match(readFileSync(join(dir, '.gitignore'), 'utf8'), /^\/build\/$/m);
  assert.match(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: dir, encoding: 'utf8' }), /gỡ file sinh tự động khỏi git \(build\)/);
});

test('dọn file / bổ sung khung bị chặn khi project đang có nhiệm vụ chạy', async () => {
  const { desk, store } = deskWithProject(async () => {});
  const task = store.insertTask({ projectId: 'demo', role: 'xung-kich', title: 'Lát 1', detail: 'd', expected: 'e', verification: 'v', assignedBy: 'tham-muu-truong', gate: false, urgent: false });
  store.updateTask(task.id, { status: 'running' });

  await assert.rejects(desk.cleanGenerated('demo'), /đang có nhiệm vụ chạy/);
  assert.throws(() => desk.applyBase('demo'), /đang có nhiệm vụ chạy/);
});

/**
 * Base giả kiểu project_app / project_server / project_web, có đổi tên theo project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
function fakeFullstackBase(root: string) {
  const baseDir = join(root, 'base-fullstack');
  writeFiles(baseDir, {
    'project_app/pubspec.yaml': 'name: app',
    'project_server/pubspec.yaml': 'name: server',
    'project_server/.dart_tool/rac': 'rác',
    'project_web/package.json': '{"scripts":{"api:types":"openapi-typescript ../project_server/openapi.yaml"}}',
    'project_web/README.md': 'README của base',
    dev: '#!/bin/sh',
    'docker-compose.yml': 'name: ${COMPOSE_PROJECT_NAME:-project}\nbuild: ./project_server\n',
    '.gitignore': '# bí mật\n.env\n.DS_Store\n',
  });
  return {
    name: 'fullstack',
    dir: baseDir,
    exclude: ['project_server/.dart_tool'],
    rename: { from: 'project', files: ['docker-compose.yml', 'project_web/package.json'] },
    parts: [
      { ...singlePart({})[0]!, name: 'app', dir: '*_app', fallbackDirs: ['app', '.'] },
      { name: 'server', dir: '*_server', marker: 'pubspec.yaml', commands: {} },
      { name: 'web', dir: '*_web', marker: 'package.json', fallbackDirs: ['web'], commands: {} },
    ],
  };
}

test('lập project: thư mục project_* đổi thành <tên>_app/_server/_web, tên trong file cũng đổi', () => {
  const environment = testEnvironment();
  environment.workspace.dirs.base = fakeFullstackBase(environment.root);

  environment.workspace.create('quan-ly-kho', 'Quản lý kho', 'brief');

  const dir = environment.workspace.projectDir('quan-ly-kho');
  for (const name of ['quan_ly_kho_app', 'quan_ly_kho_server', 'quan_ly_kho_web']) assert.ok(existsSync(join(dir, name)), name);
  assert.equal(existsSync(join(dir, 'project_app')), false);
  assert.equal(existsSync(join(dir, 'quan_ly_kho_server/.dart_tool')), false);
  assert.equal(readFileSync(join(dir, 'docker-compose.yml'), 'utf8'), 'name: ${COMPOSE_PROJECT_NAME:-quan_ly_kho}\nbuild: ./quan_ly_kho_server\n');
  assert.match(readFileSync(join(dir, 'quan_ly_kho_web/package.json'), 'utf8'), /\.\.\/quan_ly_kho_server\/openapi\.yaml/);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }), '');
});

test('bổ sung khung chuẩn: thêm phần thiếu theo tên project, không ghi đè, không chép app khi Flutter đã ở gốc, rồi commit', () => {
  const { desk, workspace, root } = deskWithProject();
  workspace.dirs.base = fakeFullstackBase(root);
  const dir = workspace.projectDir('demo');
  writeFiles(dir, { 'pubspec.yaml': 'name: cu', 'web/README.md': 'README của project', dev: 'bản riêng', '.gitignore': '.DS_Store' });

  const added = desk.applyBase('demo');

  assert.deepEqual([...added].sort(), ['.gitignore (gộp dòng thiếu)', 'demo_server', 'demo_web', 'docker-compose.yml']);
  assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), '.DS_Store\n.env\n');
  assert.equal(readFileSync(join(dir, 'dev'), 'utf8'), 'bản riêng');
  assert.equal(existsSync(join(dir, 'demo_app')), false);
  assert.equal(existsSync(join(dir, 'demo_server/.dart_tool')), false);
  assert.equal(readFileSync(join(dir, 'web/README.md'), 'utf8'), 'README của project');
  assert.match(readFileSync(join(dir, 'docker-compose.yml'), 'utf8'), /\.\/demo_server/);
  assert.match(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: dir, encoding: 'utf8' }), /bổ sung khung chuẩn/);
  assert.deepEqual(desk.applyBase('demo'), []);
});

test('Tham mưu trưởng bỏ nhiệm vụ, dọn file, bổ sung khung bằng lệnh máy; lỗi thì ghi lý do', async () => {
  const { store } = deskWithProject();
  const task = store.insertTask({ projectId: 'demo', role: 'tac-chien', title: 'PRD', detail: 'd', expected: 'e', verification: 'v', assignedBy: 'tham-muu-truong', gate: true, urgent: false });
  const calls: string[] = [];
  const projectOps: ProjectOps = {
    cancelTask: (taskId) => calls.push(`cancel ${taskId}`),
    cleanGenerated: async (projectId) => {
      calls.push(`clean ${projectId}`);
      return ['build'];
    },
    applyBase: (projectId) => {
      calls.push(`base ${projectId}`);
      return ['be', 'web'];
    },
  };
  const context = { store, team: fakeTeam(), currentProjectId: 'demo', createProject: () => 'never', projectOps };

  const outcome = await applyManagerActions(
    [{ type: 'cancel_task', taskId: task.id }, { type: 'clean_generated' }, { type: 'apply_base', projectId: 'demo' }, { type: 'cancel_task', taskId: 999 }],
    context,
  );

  assert.deepEqual(calls, [`cancel ${task.id}`, 'clean demo', 'base demo']);
  assert.deepEqual(outcome.done, [`đã bỏ nhiệm vụ #${task.id}`, 'đã chuyển vào Thùng rác (demo): build', 'đã bổ sung khung chuẩn (demo): be, web']);
  assert.match(outcome.rejected[0] ?? '', /cancel_task: không có nhiệm vụ #999/);

  const withoutOps = await applyManagerActions([{ type: 'clean_generated' }], { ...context, projectOps: undefined });
  assert.match(withoutOps.rejected[0] ?? '', /máy chưa hỗ trợ/);
});
