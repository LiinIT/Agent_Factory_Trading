import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { changedBetween, scopeViolations, snapshotRun } from '../src/scope-guard.ts';

/**
 * Hai repo git tạm: project và gốc DV2 (có brain/ea), project liên kết brain-ea tới bộ não chung.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function repos() {
  const root = mkdtempSync(join(tmpdir(), 'scope-'));
  const project = join(root, 'project');
  const factory = join(root, 'factory');
  mkdirSync(join(project, 'brain'), { recursive: true });
  mkdirSync(join(factory, 'brain/ea/scouting'), { recursive: true });
  writeFileSync(join(project, 'brain/brief.md'), 'brief\n');
  writeFileSync(join(factory, 'brain/ea/README.md'), 'readme\n');
  writeFileSync(join(factory, 'package.json'), '{}\n');
  symlinkSync(join(factory, 'brain/ea'), join(project, 'brain-ea'), 'dir');
  writeFileSync(join(project, '.gitignore'), 'brain-ea\n');
  for (const dir of [project, factory]) {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
    execFileSync('git', ['add', '-A'], { cwd: dir });
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init'], { cwd: dir });
  }
  return { project, factory };
}

test('thay đổi ở project và bộ não chung được phát hiện, bộ não hiện dưới tên brain-ea/', () => {
  const { project, factory } = repos();
  const before = snapshotRun(project, factory);
  writeFileSync(join(project, 'ea.mq5'), 'x');
  writeFileSync(join(factory, 'brain/ea/scouting/a.md'), 'thẻ');
  writeFileSync(join(factory, 'package.json'), '{"đổi":1}\n');
  const changed = changedBetween(before, snapshotRun(project, factory));
  assert.deepEqual(changed, ['brain-ea/scouting/a.md', 'ea.mq5', 'ngoài-project/package.json']);
});

test('sửa lại file đã bẩn từ trước vẫn bị phát hiện (so nội dung, không chỉ trạng thái)', () => {
  const { project, factory } = repos();
  writeFileSync(join(project, 'brain/brief.md'), 'sửa lần 1\n');
  const before = snapshotRun(project, factory);
  writeFileSync(join(project, 'brain/brief.md'), 'sửa lần 2\n');
  assert.deepEqual(changedBetween(before, snapshotRun(project, factory)), ['brain/brief.md']);
});

test('xóa file đang theo dõi được tính là thay đổi', () => {
  const { project, factory } = repos();
  const before = snapshotRun(project, factory);
  rmSync(join(project, 'brain/brief.md'));
  assert.deepEqual(changedBetween(before, snapshotRun(project, factory)), ['brain/brief.md']);
});

test('scopeViolations: chỉ chấp nhận đường dẫn trong vùng ghi; writes rỗng thì không áp quy tắc', () => {
  const writes = ['brain-ea/scouting/', 'brain/analysis.md'];
  assert.deepEqual(scopeViolations(['brain-ea/scouting/a.md', 'brain/analysis.md'], writes), []);
  assert.deepEqual(scopeViolations(['brain-ea/patterns/x.md', 'ea/bot.mq5', 'brain/analysis.md.bak'], writes), ['brain-ea/patterns/x.md', 'ea/bot.mq5', 'brain/analysis.md.bak']);
  assert.deepEqual(scopeViolations(['bất-kỳ'], []), []);
  assert.deepEqual(scopeViolations(['brain/hypothesis.md'], ['brain/']), []);
});
