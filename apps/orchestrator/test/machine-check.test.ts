import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { test } from 'node:test';

import { type BasePart, loadDefaultBase } from '../src/bases.ts';
import { ACCEPTANCE_CHECK, QUICK_CHECK, type RunCommand, runMachineCheck } from '../src/machine-check.ts';

const PARTS: BasePart[] = [
  { name: 'app', dir: '*_app', marker: 'pubspec.yaml', fallbackDirs: ['app', '.'], requires: { codegen: 'build_runner' }, commands: { codegen: ['dart', 'gen'], analyze: ['flutter', 'analyze'] } },
  { name: 'server', dir: '*_server', marker: 'pubspec.yaml', commands: { analyze: ['dart', 'analyze'], test: ['dart', 'test'] } },
  { name: 'web', dir: '*_web', marker: 'package.json', fallbackDirs: ['web'], commands: { analyze: ['npm', 'run', 'typecheck'] } },
  { name: 'be', dir: 'be', marker: 'package.json', commands: { test: ['npm', 'test'] } },
];

/**
 * Tạo project tạm với các file [files] (đường dẫn tương đối → nội dung).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function projectWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'dv0-check-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * Lệnh máy giả: ghi lại `<thư mục>$ <lệnh>`, lệnh nằm trong [failing] thì báo lỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function recorder(projectDir: string, failing: string[] = []): { calls: string[]; run: RunCommand } {
  const calls: string[] = [];
  const run: RunCommand = async (command, cwd) => {
    const line = `${relative(projectDir, cwd) || '.'}$ ${command.join(' ')}`;
    calls.push(line);
    return { ok: !failing.includes(line), output: line };
  };
  return { calls, run };
}

test('project <tên>_app/_server/_web: mỗi phần chạy trong thư mục của nó, bước ghi <phần>:<bước>', async () => {
  const dir = projectWith({ 'shop_app/pubspec.yaml': 'dev_dependencies:\n  build_runner: any\n', 'shop_server/pubspec.yaml': 'name: server', 'shop_web/package.json': '{}' });
  const { calls, run } = recorder(dir);

  const result = await runMachineCheck(dir, PARTS, run, { ...ACCEPTANCE_CHECK, steps: ['codegen', 'analyze', 'test'] });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, ['shop_app$ dart gen', 'shop_app$ flutter analyze', 'shop_server$ dart analyze', 'shop_server$ dart test', 'shop_web$ npm run typecheck']);
  assert.deepEqual(result.steps.map((step) => step.name), ['app:codegen', 'app:analyze', 'server:analyze', 'server:test', 'web:analyze']);
});

test('project kiểu app/ web/ be/ (NestJS) vẫn được kiểm qua fallbackDirs', async () => {
  const dir = projectWith({ 'app/pubspec.yaml': 'name: app', 'be/package.json': '{}', 'web/package.json': '{}' });
  const { calls, run } = recorder(dir);

  await runMachineCheck(dir, PARTS, run, { ...ACCEPTANCE_CHECK, steps: ['analyze', 'test'] });

  assert.deepEqual(calls, ['app$ flutter analyze', 'web$ npm run typecheck', 'be$ npm test']);
});

test('project cũ có Flutter ở gốc vẫn được kiểm (fallbackDir), codegen bỏ khi không có build_runner', async () => {
  const dir = projectWith({ 'pubspec.yaml': 'name: app\n' });
  const { calls, run } = recorder(dir);

  const result = await runMachineCheck(dir, PARTS, run, QUICK_CHECK);

  assert.equal(result.ok, true);
  assert.deepEqual(calls, ['.$ flutter analyze']);
});

test('Tà môn dừng ở bước lỗi đầu tiên, không chạy các phần sau', async () => {
  const dir = projectWith({ 'x_app/pubspec.yaml': 'name: app\n', 'x_server/pubspec.yaml': 'name: server', 'x_web/package.json': '{}' });
  const { calls, run } = recorder(dir, ['x_server$ dart analyze']);

  const result = await runMachineCheck(dir, PARTS, run, QUICK_CHECK);

  assert.equal(result.ok, false);
  assert.deepEqual(calls, ['x_app$ flutter analyze', 'x_server$ dart analyze']);
});

test('không có phần nào → bỏ qua (skipped)', async () => {
  const dir = projectWith({ 'README.md': '# trống' });
  const result = await runMachineCheck(dir, PARTS, recorder(dir).run);
  assert.equal(result.skipped, true);
});

test('registry thật: base fullstack có app / server / web (+ be cũ), mỗi phần có analyze + test, đổi tên theo project', () => {
  const base = loadDefaultBase(resolve(import.meta.dirname, '../../../bases'));

  assert.equal(base?.name, 'fullstack');
  assert.deepEqual(base?.parts.map((part) => part.name), ['app', 'server', 'web', 'be']);
  for (const part of base?.parts ?? []) {
    assert.ok(part.commands.analyze && part.commands.test, `phần ${part.name} thiếu analyze/test`);
  }
  assert.equal(base?.rename?.from, 'project');
  assert.ok(base?.exclude.includes('project_web/node_modules'));
  assert.ok(base?.exclude.includes('project_server/.dart_tool'));
});
