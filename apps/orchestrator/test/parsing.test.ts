import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildClaudeArgs } from '../src/claude-runner.ts';
import { isUsageLimitText, pauseUntilFor } from '../src/quota.ts';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildBriefing, isFaithful } from '../src/briefing.ts';
import { windowDelta } from '../src/logistics.ts';
import { checkPermission } from '../src/permission-policy.ts';
import { listReports, reportsRoot, serveReport } from '../src/reports.ts';
import { formatReport, parseReport } from '../src/report.ts';
import { parseStreamLine, suggestPermissions } from '../src/stream-parser.ts';
import { parseRoleFile } from '../src/team.ts';
import { slugify } from '../src/workspace.ts';
import { THRESHOLDS } from './helpers.ts';

const NOW = 1_792_000_000_000;

test('parseRoleFile đọc frontmatter và prompt', () => {
  const roleDefinition = parseRoleFile(
    '---\nname: qa\ntitle: QA\nmodel: sonnet\ngate: true\ntimeoutMinutes: 25\nallowedTools: Read, Bash(flutter *)\n---\n\nBạn là QA.\n',
  );
  assert.equal(roleDefinition.name, 'qa');
  assert.equal(roleDefinition.gate, true);
  assert.equal(roleDefinition.timeoutMinutes, 25);
  assert.deepEqual(roleDefinition.allowedTools, ['Read', 'Bash(flutter *)']);
  assert.equal(roleDefinition.prompt, 'Bạn là QA.');
});

test('parseRoleFile báo lỗi khi thiếu model', () => {
  assert.throws(() => parseRoleFile('---\nname: x\n---\nabc'));
});

test('parseStreamLine lấy session, lời nói, tool, quota, kết quả', () => {
  assert.deepEqual(parseStreamLine('{"type":"system","subtype":"init","session_id":"abc","model":"claude-sonnet-5-5"}'), [
    { kind: 'session', sessionId: 'abc', model: 'claude-sonnet-5-5' },
  ]);
  const assistant = parseStreamLine(
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: ' Đang chạy test ' },
          { type: 'tool_use', name: 'Bash', input: { command: 'flutter test' } },
          { type: 'tool_use', name: 'StructuredOutput', input: {} },
        ],
      },
    }),
  );
  assert.deepEqual(assistant, [
    { kind: 'text', text: 'Đang chạy test' },
    { kind: 'tool', text: 'Bash: flutter test' },
  ]);
  const [quota] = parseStreamLine(
    JSON.stringify({
      type: 'rate_limit_event',
      rate_limit_info: {
        status: 'allowed_warning',
        unifiedWindows: {
          five_hour: { utilization: 0.23, resetsAt: 1792150800 },
          seven_day: { utilization: 0.81, resetsAt: 1792350000 },
        },
      },
    }),
    NOW,
  );
  assert.deepEqual(quota, {
    kind: 'quota',
    quota: {
      status: 'allowed_warning',
      fiveHour: { utilization: 0.23, resetsAt: 1792150800 },
      sevenDay: { utilization: 0.81, resetsAt: 1792350000 },
      updatedAt: NOW,
    },
  });
  const [result] = parseStreamLine(
    '{"type":"result","subtype":"success","is_error":false,"result":"xong","structured_output":{"a":1},"total_cost_usd":0.5,"duration_ms":1200,"usage":{"input_tokens":2,"cache_creation_input_tokens":300,"cache_read_input_tokens":4000,"output_tokens":7}}',
  );
  assert.deepEqual(result, {
    kind: 'result',
    isError: false,
    text: 'xong',
    structured: { a: 1 },
    costUsd: 0.5,
    denials: [],
    usage: { inputTokens: 2, cacheCreationTokens: 300, cacheReadTokens: 4000, outputTokens: 7 },
    durationMs: 1200,
  });
  assert.deepEqual(parseStreamLine('không phải json'), []);
});

test('pauseUntilFor dừng tới giờ reset khi vượt ngưỡng', () => {
  const resetsAt = NOW / 1000 + 3600;
  const quota = { status: 'allowed', fiveHour: { utilization: 0.95, resetsAt }, sevenDay: null, updatedAt: NOW };
  assert.equal(pauseUntilFor(quota, THRESHOLDS, NOW), resetsAt * 1000);
  assert.equal(pauseUntilFor({ ...quota, fiveHour: { utilization: 0.5, resetsAt } }, THRESHOLDS, NOW), null);
});

test('pauseUntilFor dùng thời gian dự phòng khi bị từ chối mà không rõ giờ reset', () => {
  const quota = { status: 'rejected', fiveHour: null, sevenDay: null, updatedAt: NOW };
  assert.equal(pauseUntilFor(quota, THRESHOLDS, NOW), NOW + 60 * 60_000);
});

test('isUsageLimitText nhận ra lỗi hết quota', () => {
  assert.equal(isUsageLimitText("You've hit your limit · resets 3pm"), true);
  assert.equal(isUsageLimitText("You've hit your weekly limit · resets Oct 19 at 2am (Asia/Saigon)"), true);
  assert.equal(isUsageLimitText("You've hit your Opus limit"), true);
  assert.equal(isUsageLimitText('Claude AI usage limit reached|1792150800'), true);
  assert.equal(isUsageLimitText('TypeError: x is undefined'), false);
});

test('slugify bỏ dấu tiếng Việt', () => {
  assert.equal(slugify('App ghi chú Chi tiêu — Đà Nẵng!'), 'app-ghi-chu-chi-tieu-da-nang');
  assert.equal(slugify('!!!'), 'project');
});

test('buildClaudeArgs giới hạn tool, thêm Skill, tự từ chối quyền ngoài danh sách', () => {
  const args = buildClaudeArgs({
    cwd: '/tmp',
    prompt: 'x',
    systemPrompt: 'vai',
    model: 'opus',
    allowedTools: ['Read', 'Bash(flutter *)'],
    timeoutMs: 1000,
    resumeSessionId: 'sess',
  });
  const valueOf = (flag: string) => args[args.indexOf(flag) + 1];
  assert.equal(valueOf('--permission-mode'), 'dontAsk');
  assert.equal(valueOf('--setting-sources'), 'project');
  assert.ok(args.includes('--strict-mcp-config'));
  assert.equal(valueOf('--tools'), 'Read,Bash,Skill');
  assert.equal(valueOf('--allowedTools'), 'Read,Bash(flutter *),Skill');
  assert.equal(valueOf('--fallback-model'), 'sonnet');
  assert.equal(valueOf('--resume'), 'sess');
});

test('suggestPermissions gợi ý mẫu quyền từ permission_denials thật', () => {
  const denials = [
    { tool_name: 'Bash', tool_use_id: 'a', tool_input: { command: 'curl -s https://example.com' } },
    { tool_name: 'Bash', tool_use_id: 'b', tool_input: { command: 'curl -I https://x.dev' } },
    { tool_name: 'WebFetch', tool_use_id: 'c', tool_input: { url: 'https://x.dev' } },
  ];
  assert.deepEqual(suggestPermissions(denials), ['Bash(curl *)', 'WebFetch']);
  assert.deepEqual(suggestPermissions(undefined), []);
});

test('checkPermission chặn quyền nguy hiểm, đánh dấu quyền rủi ro', () => {
  assert.deepEqual(checkPermission('Bash(flutter pub *)'), { allowed: true, risky: false });
  assert.deepEqual(checkPermission('Bash(curl *)'), { allowed: true, risky: true });
  for (const tool of ['Bash', 'Bash(*)', 'Bash(sudo *)', 'Bash(git push *)', 'Bash(rm -rf *)', 'Bash(sh -c *)', 'Bash(a) && rm', 'Bash((x))']) {
    assert.equal(checkPermission(tool).allowed, false, tool);
  }
});

test('parseReport: câu hỏi buộc kết quả CẦN HỎI; sai định dạng thì null', () => {
  const parsed = parseReport({ mission: 'm', result: 'ĐẠT', evidence: 'e', obstacles: '', questions: [' Có cần đăng nhập? ', ''], proposal: 'p' });
  assert.equal(parsed?.result, 'CẦN HỎI');
  assert.deepEqual(parsed?.questions, ['Có cần đăng nhập?']);
  assert.equal(parsed?.obstacles, 'Không');
  assert.equal(parseReport({ result: 'OK' }), null);
  const text = formatReport({ taskId: 7, unit: 'Ban Kiểm soát', model: 'sonnet', assignedBy: 'tham-muu-truong', expected: 'x', verification: 'y' }, parsed!);
  assert.match(text, /^BÁO CÁO #7 · Ban Kiểm soát → Tham mưu trưởng/);
  assert.match(text, /CÂU HỎI   : \(1\) Có cần đăng nhập\?/);
});

test('windowDelta: chênh lệch trong cùng khung; khung đã reset thì lấy mức sau', () => {
  assert.ok(Math.abs((windowDelta({ utilization: 0.4, resetsAt: 1 }, { utilization: 0.45, resetsAt: 1 }) ?? 0) - 0.05) < 1e-9);
  assert.equal(windowDelta({ utilization: 0.9, resetsAt: 1 }, { utilization: 0.1, resetsAt: 2 }), 0.1);
  assert.equal(windowDelta(null, { utilization: 0.1, resetsAt: 2 }), null);
});

/**
 * Response giả ghi lại status, header, body.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function fakeResponse() {
  const captured = { status: 0, headers: {} as Record<string, string>, body: '' };
  const response = {
    writeHead: (status: number, headers: Record<string, string>) => Object.assign(captured, { status, headers }),
    end: (body: string | Buffer) => {
      captured.body = String(body);
    },
  } as unknown as ServerResponse;
  return { response, captured };
}

test('serveReport: phục vụ báo cáo mới nhất với CSP sandbox, chặn thoát thư mục và symlink', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'report-'));
  mkdirSync(join(projectDir, 'reports'), { recursive: true });
  writeFileSync(join(projectDir, 'reports/bot-2026-10-23.html'), '<h1>Báo cáo cũ</h1>');
  writeFileSync(join(projectDir, 'reports/bot-2026-10-24.html'), '<h1>Báo cáo mới</h1>');
  writeFileSync(join(projectDir, 'secret.txt'), 'bí mật');
  symlinkSync(join(projectDir, 'secret.txt'), join(projectDir, 'reports/link.txt'));

  const latest = fakeResponse();
  serveReport(latest.response, projectDir, '/');
  assert.equal(latest.captured.status, 200);
  assert.match(latest.captured.headers['content-security-policy'] ?? '', /^sandbox allow-scripts/);
  assert.match(latest.captured.body, /Báo cáo mới/);

  const older = fakeResponse();
  serveReport(older.response, projectDir, '/bot-2026-10-23.html');
  assert.match(older.captured.body, /Báo cáo cũ/);

  for (const path of ['/../secret.txt', '/link.txt']) {
    const blocked = fakeResponse();
    serveReport(blocked.response, projectDir, path);
    assert.equal(blocked.captured.status, 404, path);
    assert.doesNotMatch(blocked.captured.body, /bí mật/);
  }
});

test('buildBriefing: model không có thì đọc nguyên dữ kiện máy', async () => {
  const briefing = await buildBriefing('Không ban nào đang làm.', 'model-khong-ton-tai');
  assert.equal(briefing.source, 'may');
  assert.equal(briefing.text, 'Báo cáo Thủ trưởng: Không ban nào đang làm.');
});

test('isFaithful: thiếu số liệu hoặc sai mẫu mở đầu thì loại bản viết lại', () => {
  const facts = 'Hàng đợi 2 nhiệm vụ. Chờ duyệt 1.';
  assert.equal(isFaithful('Báo cáo Thủ trưởng: hàng đợi 2, chờ duyệt 1.', facts), true);
  assert.equal(isFaithful('Báo cáo Chỉ huy trưởng: hàng đợi 2, chờ duyệt 1.', facts), true);
  assert.equal(isFaithful('Báo cáo Chỉ huy trưởng: hàng đợi 2 nhiệm vụ.', facts), false);
  assert.equal(isFaithful('Thưa chỉ huy, hàng đợi 2, chờ duyệt 1.', facts), false);
});

test('cấu hình: workspaceDir hiểu ~/ và mặc định là workspace_dv2', async () => {
  const { expandHome, loadConfig } = await import('../src/config.ts');
  const { homedir } = await import('node:os');
  assert.equal(expandHome('~/Documents/x'), `${homedir()}/Documents/x`);
  assert.equal(expandHome('workspace'), 'workspace');
  assert.equal(loadConfig().workspaceDir, `${homedir()}/Documents/StudioMia_workspace/workspace_dv2`);
});

test('báo cáo có mục Cách chạy: thiếu thì "Không" (không in), có thì in dòng CÁCH CHẠY', () => {
  const header = { taskId: 9, unit: 'Đại đội Xung kích', model: 'sonnet', assignedBy: 'tham-muu-truong', expected: 'x', verification: 'y' };
  const withoutRun = parseReport({ mission: 'm', result: 'ĐẠT', evidence: 'e', obstacles: '', questions: [], proposal: 'p' });
  assert.equal(withoutRun?.howToRun, 'Không');
  assert.doesNotMatch(formatReport(header, withoutRun!), /CÁCH CHẠY/);
  const withRun = parseReport({ mission: 'm', result: 'ĐẠT', evidence: 'e', obstacles: '', questions: [], proposal: 'p', howToRun: 'flutter pub get\nflutter run -d "iPhone 17 Pro"' });
  assert.match(formatReport(header, withRun!), /\nCÁCH CHẠY : flutter pub get\nflutter run -d "iPhone 17 Pro"$/);
});

test('báo cáo: chưa có thư mục hoặc chưa có .html thì báo chưa có; liệt kê mới nhất trước, bỏ file không phải .html', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'report-root-'));
  assert.equal(reportsRoot(projectDir), null);
  const missing = fakeResponse();
  serveReport(missing.response, projectDir, '/');
  assert.equal(missing.captured.status, 404);

  mkdirSync(join(projectDir, 'reports'), { recursive: true });
  writeFileSync(join(projectDir, 'reports/.gitkeep'), '');
  writeFileSync(join(projectDir, 'reports/ghi-chu.txt'), 'x');
  assert.equal(reportsRoot(projectDir), null);

  writeFileSync(join(projectDir, 'reports/a-2026-10-01.html'), 'a');
  writeFileSync(join(projectDir, 'reports/a-2026-10-02.html'), 'b');
  assert.deepEqual(listReports(projectDir), ['a-2026-10-02.html', 'a-2026-10-01.html']);
  assert.equal(reportsRoot(projectDir), join(projectDir, 'reports'));
});

test('vai có Bash nhận quy tắc lệnh đơn; quyền cấp sẵn đều qua được Ban Bảo mật', async () => {
  const { ModeState } = await import('../src/mode.ts');
  const { loadTeam } = await import('../src/team.ts');
  const { checkPermission } = await import('../src/permission-policy.ts');
  const { FactoryStore } = await import('../src/store.ts');
  const team = loadTeam(join(import.meta.dirname, '../../../team'));
  const mode = new ModeState(new FactoryStore(':memory:'), {});
  const xungKich = team.get('ea-che-tao');
  const manager = team.get('tham-muu-truong');
  assert.ok(xungKich && manager);
  assert.match(mode.roleRun(xungKich).systemPrompt, /Quy tắc lệnh Bash/);
  assert.doesNotMatch(mode.roleRun(manager).systemPrompt, /Quy tắc lệnh Bash/);
  for (const role of team.values()) {
    for (const tool of role.allowedTools.filter((item) => item.startsWith('Bash('))) {
      assert.equal(checkPermission(tool).allowed, true, `${role.name}: ${tool}`);
    }
  }
});

test('báo cáo: nhúng sẵn CSS / JS cục bộ vào trang, không nhúng file ngoài thư mục báo cáo', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'report-inline-'));
  mkdirSync(join(projectDir, 'reports'), { recursive: true });
  writeFileSync(join(projectDir, 'secret.js'), 'const token = "bí mật";');
  writeFileSync(join(projectDir, 'reports/style.css'), 'body { color: red; }');
  writeFileSync(join(projectDir, 'reports/app.js'), 'document.title = "</script>ok";');
  writeFileSync(
    join(projectDir, 'reports/bot-2026-10-24.html'),
    '<link rel="stylesheet" href="style.css"><link rel="icon" href="x.png"><script src="app.js"></script><script src="../secret.js"></script><script src="https://cdn.example/x.js"></script>',
  );
  const page = fakeResponse();
  serveReport(page.response, projectDir, '/');
  assert.match(page.captured.body, /<style>body \{ color: red; \}<\/style>/);
  assert.match(page.captured.body, /<script>document\.title = "<\\\/script>ok";<\/script>/);
  assert.match(page.captured.body, /<link rel="icon" href="x\.png">/);
  assert.match(page.captured.body, /<script src="\.\.\/secret\.js"><\/script>/);
  assert.doesNotMatch(page.captured.body, /bí mật/);
  assert.match(page.captured.body, /<script src="https:\/\/cdn\.example\/x\.js"><\/script>/);
});
