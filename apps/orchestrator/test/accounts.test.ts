import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AccountDesk, describeStatus, parseAccountCommand } from '../src/accounts.ts';
import { ACCOUNT_CARD_AUTHOR, Manager } from '../src/manager.ts';
import { ProviderRouter } from '../src/providers.ts';
import { memoryStore } from '../src/secrets.ts';
import type { RunRequest, RunResult } from '../src/types.ts';
import { fakeTeam, okResult, testEnvironment } from './helpers.ts';

const ALT_TOKEN = 'sk-ant-oat-test-alt';
const WEEKLY_LIMIT: RunResult = { ...okResult("You've hit your weekly limit · resets Oct 19 at 2am (Asia/Saigon)"), ok: false, isUsageLimit: true };
const REPLY = okResult('', { reply: 'Báo cáo Thủ trưởng: đã nhận lệnh.', actions: [] });

/**
 * Dựng Tham mưu trưởng + Ban Thông tin tài khoản với engine Claude giả ghi lại token đã dùng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function deskWith(results: RunResult[]) {
  const environment = testEnvironment();
  const secrets = memoryStore();
  const tokensUsed: string[] = [];
  const engine = async (request: RunRequest) => {
    tokensUsed.push(request.env?.CLAUDE_CODE_OAUTH_TOKEN ?? 'main');
    return results.shift() ?? REPLY;
  };
  const router = new ProviderRouter({
    store: environment.store,
    secrets,
    quota: environment.quota,
    engines: { claude: engine, codex: engine },
    defaultCapUsd: 5,
    openAiPricePerMillion: { input: 1, output: 1 },
  });
  environment.quota.setSources(() => router.sourcesInUse());
  const manager = new Manager({ ...environment, team: fakeTeam(), runClaude: router.run, timeoutMinutes: 1, historyLimit: 10 });
  let ticks = 0;
  const desk = new AccountDesk({ router, quota: environment.quota, secrets, manager, bus: environment.bus, tickScheduler: () => ticks++ });
  return { ...environment, router, manager, desk, secrets, tokensUsed, ticks: () => ticks };
}

test('parseAccountCommand nhận lệnh có dấu / không dấu, bỏ qua câu dài', () => {
  assert.equal(parseAccountCommand('Chuyển tài khoản phụ'), 'use-alt');
  assert.equal(parseAccountCommand('chuyen sang tai khoan phu'), 'use-alt');
  assert.equal(parseAccountCommand('Dùng tài khoản chính.'), 'use-main');
  assert.equal(parseAccountCommand('quay lại tài khoản chính'), 'use-main');
  assert.equal(parseAccountCommand('Tình hình tài khoản'), 'status');
  assert.equal(parseAccountCommand('tài khoản'), 'status');
  assert.equal(parseAccountCommand('làm app quản lý tài khoản phụ cho cửa hàng'), null);
});

test('hết hạn mức: Tham mưu trưởng báo kèm thẻ đổi tài khoản và giữ tin để gửi lại', async () => {
  const { manager, store } = deskWith([WEEKLY_LIMIT]);
  await manager.consult({ sender: 'user', text: 'Làm app ghi chú' });
  const last = store.recentMessages(10).at(-1);
  assert.equal(last?.author, ACCOUNT_CARD_AUTHOR);
  assert.match(last?.text ?? '', /weekly limit/);
  assert.equal(manager.hasPendingRetry(), true);
});

test('chưa có token thì không chuyển được sang tài khoản phụ', async () => {
  const { desk, router } = deskWith([]);
  await assert.rejects(desk.use('claude-alt'), /chưa có token/);
  assert.equal(router.preferred(), 'claude-main');
});

test('chuyển sang tài khoản phụ: chạy bằng token phụ, gửi lại tin lỗi, không lặp tin trong chat', async () => {
  const { desk, manager, router, secrets, store, tokensUsed, ticks } = deskWith([WEEKLY_LIMIT]);
  await manager.consult({ sender: 'user', text: 'Làm app ghi chú' });
  await secrets.set('CLAUDE_CODE_OAUTH_TOKEN', ALT_TOKEN);

  const status = await desk.use('claude-alt');
  await manager.idle();

  assert.equal(router.preferred(), 'claude-alt');
  assert.equal(router.fallback(), 'claude-main');
  assert.deepEqual(tokensUsed, ['main', ALT_TOKEN]);
  assert.equal(manager.hasPendingRetry(), false);
  assert.equal(ticks(), 1);
  assert.equal(status.accounts.find((account) => account.id === 'claude-main')?.pausedUntil !== null, true);
  const messages = store.recentMessages(10);
  assert.equal(messages.filter((message) => message.sender === 'user').length, 1);
  assert.equal(messages.at(-1)?.sender, 'manager');
});

test('lệnh "tình hình tài khoản" báo tài khoản hết hạn mức và tài khoản chạy lượt kế', async () => {
  const { desk, quota, secrets } = deskWith([]);
  await secrets.set('CLAUDE_CODE_OAUTH_TOKEN', ALT_TOKEN);
  await desk.use('claude-main');
  quota.markUsageLimit('claude-main');
  const text = await desk.runCommand('status');
  assert.match(text, /^\[ BÁO CÁO \] Tình hình tài khoản Claude\./);
  assert.match(text, /\n- \*\*Claude · gói chính\*\* \(ưu tiên\): !!hết hạn mức tới [^!]+!!/);
  assert.match(text, /\n- \*\*Claude · tài khoản phụ\*\* \(dự phòng\): sẵn sàng/);
  assert.match(text, /\n- Lượt kế tiếp chạy bằng: \*\*Claude · tài khoản phụ\*\*\./);
  assert.equal(describeStatus(await desk.status()), text);
});
