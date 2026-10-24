import assert from 'node:assert/strict';
import { test } from 'node:test';

import { browserBriefing, browserViolation, isAllowedHost, usesBrowser } from '../src/browser-guard.ts';
import { buildClaudeArgs } from '../src/claude-runner.ts';
import { parseStreamLine } from '../src/stream-parser.ts';

const HOSTS = ['tradingview.com', 'mql5.com'];

test('isAllowedHost: đúng tên miền hoặc tên miền con, không nhận tên miền giả mạo', () => {
  assert.equal(isAllowedHost('tradingview.com', HOSTS), true);
  assert.equal(isAllowedHost('www.tradingview.com', HOSTS), true);
  assert.equal(isAllowedHost('in.TradingView.com', HOSTS), true);
  assert.equal(isAllowedHost('tradingview.com.evil.io', HOSTS), false);
  assert.equal(isAllowedHost('eviltradingview.com', HOSTS), false);
});

test('browserViolation: navigate tới tên miền cho phép thì qua; ngoài danh sách, địa chỉ lạ, giao thức khác thì vi phạm', () => {
  const nav = (target: string) => browserViolation(`mcp__claude-in-chrome__navigate: ${target}`, HOSTS);
  assert.equal(nav('https://www.tradingview.com/script/Iko0E2kL-x/'), null);
  assert.equal(nav('www.mql5.com/en/code/123'), null);
  assert.equal(nav('back'), null);
  assert.match(nav('https://evil.example/x') ?? '', /ngoài danh sách cho phép: evil\.example/);
  assert.match(nav('javascript:alert(1)') ?? '', /không hợp lệ/);
  assert.match(nav('file:///etc/passwd') ?? '', /không hợp lệ/);
  assert.match(nav('') ?? '', /không hợp lệ/);
});

test('browserViolation: computer chỉ cho bấm trái, cuộn, chụp, chờ; gõ phím, kéo thả, bấm phải/đúp là vi phạm', () => {
  const act = (action: string) => browserViolation(`mcp__claude-in-chrome__computer: ${action}`, HOSTS);
  for (const ok of ['left_click', 'scroll', 'scroll_to', 'screenshot', 'zoom', 'wait', 'hover']) assert.equal(act(ok), null, ok);
  for (const bad of ['type', 'key', 'left_click_drag', 'right_click', 'double_click', 'triple_click']) assert.match(act(bad) ?? '', /không được phép/, bad);
});

test('browserViolation bỏ qua tool không phải trình duyệt và tool trình duyệt chỉ đọc', () => {
  assert.equal(browserViolation('Read: brain/brief.md', HOSTS), null);
  assert.equal(browserViolation('mcp__claude-in-chrome__get_page_text', HOSTS), null);
  assert.equal(browserViolation('mcp__claude-in-chrome__find: Source code tab', HOSTS), null);
});

test('stream-parser đưa url và action của tool trình duyệt vào dòng mô tả', () => {
  const line = (name: string, input: unknown) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  assert.deepEqual(parseStreamLine(line('mcp__claude-in-chrome__navigate', { url: 'https://www.tradingview.com/x', tabId: 1 })), [
    { kind: 'tool', text: 'mcp__claude-in-chrome__navigate: https://www.tradingview.com/x' },
  ]);
  assert.deepEqual(parseStreamLine(line('mcp__claude-in-chrome__computer', { action: 'left_click', ref: 'ref_40', tabId: 1 })), [
    { kind: 'tool', text: 'mcp__claude-in-chrome__computer: left_click' },
  ]);
});

test('usesBrowser và buildClaudeArgs: chỉ bật --chrome khi vai có tool trình duyệt', () => {
  assert.equal(usesBrowser(['Read', 'mcp__claude-in-chrome__navigate']), true);
  assert.equal(usesBrowser(['Read', 'WebFetch']), false);
  const base = { cwd: '/x', prompt: 'p', systemPrompt: 's', model: 'sonnet', allowedTools: ['mcp__claude-in-chrome__navigate'], timeoutMs: 1000 };
  const withChrome = buildClaudeArgs({ ...base, browser: true });
  assert.ok(withChrome.includes('--chrome'));
  assert.ok(withChrome.includes('--strict-mcp-config'));
  assert.ok(withChrome.some((arg) => arg.includes('mcp__claude-in-chrome__navigate')));
  assert.equal(buildClaudeArgs(base).includes('--chrome'), false);
});

test('browserBriefing nêu tên miền, quy tắc chỉ đọc, và deviceId khi có', () => {
  const text = browserBriefing({ allowedHosts: HOSTS, deviceId: 'D-9' });
  assert.match(text, /tradingview\.com, mql5\.com/);
  assert.match(text, /tab mới/);
  assert.match(text, /không đăng nhập/);
  assert.match(text, /select_browser với deviceId D-9/);
  assert.doesNotMatch(browserBriefing({ allowedHosts: HOSTS }), /deviceId/);
});
