import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildCodexArgs, parseCodexLine, parseCodexUsage } from '../src/codex-runner.ts';
import { ProviderRouter } from '../src/providers.ts';
import { QuotaState } from '../src/quota-state.ts';
import { memoryStore, secretHint } from '../src/secrets.ts';
import { FactoryStore } from '../src/store.ts';
import type { QuotaSnapshot, RunRequest, RunResult } from '../src/types.ts';
import { okResult, THRESHOLDS } from './helpers.ts';

const ALT_TOKEN = 'sk-ant-oat-test-alt';
const HOUR_MS = 3_600_000;
const LIMITED: RunResult = { ...okResult('limit'), ok: false, isUsageLimit: true };

const REQUEST: RunRequest = { cwd: '/tmp', prompt: 'x', systemPrompt: 'vai', model: 'sonnet', allowedTools: ['Read'], timeoutMs: 1000, role: 'xung-kich' };

/**
 * Router với engine giả ghi lại request, kho khoá trong RAM.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function routerWith(results: Partial<Record<'claude' | 'codex', RunResult[]>> = {}, secrets: Record<string, string> = {}) {
  const store = new FactoryStore(':memory:');
  const calls: { engine: string; request: RunRequest }[] = [];
  const engine = (name: 'claude' | 'codex') => async (request: RunRequest) => {
    calls.push({ engine: name, request });
    return results[name]?.shift() ?? okResult(`${name} ok`);
  };
  const quota = new QuotaState(store, THRESHOLDS);
  const router = new ProviderRouter({
    store,
    secrets: memoryStore(secrets),
    quota,
    engines: { claude: engine('claude'), codex: engine('codex') },
    defaultCapUsd: 5,
    openAiPricePerMillion: { input: 1.25, output: 10 },
  });
  quota.setSources(() => router.sourcesInUse());
  return { router, store, quota, calls };
}

test('mặc định chạy Claude gói chính, không nạp khoá nào', async () => {
  const { router, calls } = routerWith();
  const result = await router.run(REQUEST);
  assert.equal(calls[0]?.engine, 'claude');
  assert.deepEqual(calls[0]?.request.env, {});
  assert.equal(result.provider, 'claude-main');
});

test('gán Xung kích cho ChatGPT Plus: chạy Codex, model theo gán (không dùng alias Claude)', async () => {
  const { router, calls } = routerWith();
  router.assign('xung-kich', 'chatgpt-plus', '');
  await router.run(REQUEST);
  assert.equal(calls[0]?.engine, 'codex');
  assert.equal(calls[0]?.request.model, '');
});

test('Tham mưu trưởng không được gán nguồn Codex', () => {
  const { router } = routerWith();
  assert.throws(() => router.assign('tham-muu-truong', 'chatgpt-plus'), /chỉ được dùng nguồn Claude/);
  assert.doesNotThrow(() => router.assign('tham-muu-truong', 'claude-alt'));
});

test('nguồn cần khoá: thiếu khoá thì từ chối, có khoá thì nạp vào env tiến trình con', async () => {
  const missing = routerWith();
  missing.router.assign('xung-kich', 'openai-api');
  const refused = await missing.router.run(REQUEST);
  assert.equal(refused.ok, false);
  assert.match(refused.text, /chưa có khoá OPENAI_API_KEY/);
  assert.equal(missing.calls.length, 0);

  const ready = routerWith({}, { OPENAI_API_KEY: 'sk-test-1234567890abcd' });
  ready.router.assign('xung-kich', 'openai-api');
  await ready.router.run(REQUEST);
  assert.equal(ready.calls[0]?.request.env?.OPENAI_API_KEY, 'sk-test-1234567890abcd');
  assert.equal(ready.calls[0]?.request.env?.CODEX_API_KEY, 'sk-test-1234567890abcd');
});

test('nguồn trả theo token bị chặn khi chạm trần chi tiêu ngày', async () => {
  const { router, store, calls } = routerWith({}, { ANTHROPIC_API_KEY: 'sk-ant-xxxx' });
  router.assign('xung-kich', 'claude-api');
  router.setCap(1);
  store.insertRun({
    taskId: null, projectId: null, role: 'xung-kich', model: 'sonnet', ok: true, startedAt: new Date().toISOString(), durationMs: 1,
    usage: { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 }, costUsd: 1.5, fiveHourDelta: null, sevenDayDelta: null, denials: 0, provider: 'claude-api',
  });
  const result = await router.run(REQUEST);
  assert.equal(result.ok, false);
  assert.match(result.text, /chạm trần chi tiêu \$1/);
  assert.equal(calls.length, 0);
});

test('hết quota thì chuyển nguồn dự phòng một lần, bỏ resume phiên cũ', async () => {
  const limited: RunResult = { ...okResult('limit'), ok: false, isUsageLimit: true };
  const { router, calls } = routerWith({ claude: [limited] });
  router.setFallback('chatgpt-plus');
  const result = await router.run({ ...REQUEST, resumeSessionId: 'phien-claude' });
  assert.deepEqual(calls.map((call) => call.engine), ['claude', 'codex']);
  assert.equal(calls[1]?.request.resumeSessionId, null);
  assert.equal(result.provider, 'chatgpt-plus');
});

test('gói chính đang nghỉ vì quota: chạy thẳng tài khoản phụ, không gọi gói chính', async () => {
  const { router, quota, calls } = routerWith({}, { CLAUDE_CODE_OAUTH_TOKEN: ALT_TOKEN });
  router.setFallback('claude-alt');
  quota.markUsageLimit('claude-main');
  const result = await router.run({ ...REQUEST, resumeSessionId: 'phien-chinh' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.request.env?.CLAUDE_CODE_OAUTH_TOKEN, ALT_TOKEN);
  assert.equal(calls[0]?.request.resumeSessionId, null);
  assert.equal(result.provider, 'claude-alt');
  assert.equal(quota.isPaused(), false);
});

test('gói chính hết quota giữa chừng: cho nghỉ, lần sau dùng thẳng tài khoản phụ', async () => {
  const { router, quota, calls } = routerWith({ claude: [LIMITED] }, { CLAUDE_CODE_OAUTH_TOKEN: ALT_TOKEN });
  router.setFallback('claude-alt');
  await router.run(REQUEST);
  await router.run(REQUEST);
  assert.equal(quota.isSourcePaused('claude-main'), true);
  assert.deepEqual(calls.map((call) => call.request.env?.CLAUDE_CODE_OAUTH_TOKEN ?? 'main'), ['main', ALT_TOKEN, ALT_TOKEN]);
});

test('cả hai tài khoản đều nghỉ: hàng đợi dừng, ban không chạy được, không gọi model', async () => {
  const { router, quota, calls } = routerWith({}, { CLAUDE_CODE_OAUTH_TOKEN: ALT_TOKEN });
  router.setFallback('claude-alt');
  quota.markUsageLimit('claude-main');
  assert.equal(quota.isPaused(), false);
  quota.markUsageLimit('claude-alt');
  assert.equal(quota.isPaused(), true);
  assert.equal(router.canRun('xung-kich'), false);
  const result = await router.run(REQUEST);
  assert.equal(result.isUsageLimit, true);
  assert.equal(calls.length, 0);
});

test('quota ghi riêng từng nguồn: tài khoản phụ vượt ngưỡng không làm gói chính nghỉ', async () => {
  const now = Date.now();
  const nearlyFull: QuotaSnapshot = { status: 'allowed', fiveHour: { utilization: 0.95, resetsAt: (now + HOUR_MS) / 1000 }, sevenDay: null, updatedAt: now };
  const { router, quota } = routerWith();
  router.setFallback('claude-alt');
  quota.update({ ...nearlyFull, provider: 'claude-alt' }, now);
  assert.equal(quota.isSourcePaused('claude-alt'), true);
  assert.equal(quota.isSourcePaused('claude-main'), false);
  assert.equal(quota.snapshot('claude-alt')?.fiveHour?.utilization, 0.95);
  assert.equal(quota.snapshot('claude-main'), null);
});

test('quota trong kết quả được gắn tên nguồn đã chạy', async () => {
  const snapshot: QuotaSnapshot = { status: 'allowed', fiveHour: null, sevenDay: null, updatedAt: 1 };
  const { router } = routerWith({ claude: [{ ...okResult('ok'), quota: snapshot }] }, { CLAUDE_CODE_OAUTH_TOKEN: ALT_TOKEN });
  router.assign('xung-kich', 'claude-alt');
  const result = await router.run(REQUEST);
  assert.equal(result.quota?.provider, 'claude-alt');
});

test('phiên của nguồn khác thì không resume (đổi nguồn giữa chừng)', async () => {
  const { router, calls } = routerWith();
  await router.run(REQUEST);
  router.assign('xung-kich', 'chatgpt-plus');
  await router.run({ ...REQUEST, resumeSessionId: 'session-1' });
  assert.equal(calls[1]?.request.resumeSessionId, null);
});

test('secretHint chỉ lộ 4 ký tự cuối', () => {
  assert.equal(secretHint('sk-abcdefgh1234'), '••••1234');
  assert.equal(secretHint(null), null);
});

test('parseCodexLine / parseCodexUsage đọc đúng sự kiện Codex thật', () => {
  assert.deepEqual(parseCodexLine('{"type":"thread.started","thread_id":"t1"}'), [{ kind: 'session', sessionId: 't1', model: null }]);
  assert.deepEqual(parseCodexLine('{"type":"item.completed","item":{"id":"i","type":"agent_message","text":"{\\"reply\\":\\"Rõ\\"}"}}'), [
    { kind: 'text', text: '{"reply":"Rõ"}' },
  ]);
  assert.deepEqual(parseCodexLine('{"type":"item.completed","item":{"type":"command_execution","command":"flutter test"}}'), [{ kind: 'tool', text: 'Bash: flutter test' }]);
  assert.deepEqual(parseCodexUsage({ input_tokens: 23948, cached_input_tokens: 20000, cache_write_input_tokens: 0, output_tokens: 16, reasoning_output_tokens: 4 }), {
    inputTokens: 3948, cacheCreationTokens: 0, cacheReadTokens: 20000, outputTokens: 20,
  });
});

test('buildCodexArgs: ban có quyền ghi thì sandbox workspace-write, có schema, prompt qua stdin', () => {
  const args = buildCodexArgs({ ...REQUEST, allowedTools: ['Read', 'Edit'], model: 'gpt-5-codex' }, '/tmp/schema.json');
  assert.deepEqual(args, ['exec', '--json', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', '/tmp', '-m', 'gpt-5-codex', '--output-schema', '/tmp/schema.json', '-']);
  assert.deepEqual(buildCodexArgs({ ...REQUEST, resumeSessionId: 't1' }, null).slice(0, 3), ['exec', 'resume', 't1']);
});
