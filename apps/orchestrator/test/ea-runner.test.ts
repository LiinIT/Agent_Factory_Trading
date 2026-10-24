import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { compileExpert, decodeText, expertName, expertStem, loadPlan, prepareRuns, purgeAgentLogs, runPlan, type EaConfig, type Exec } from '../src/ea-runner.ts';

const REPORT = readFileSync(join(import.meta.dirname, 'fixtures/tester-report.html'), 'utf8');
const SOURCE = 'input double InpLots = 0.02;\ninput int InpPeriod = 14;\ninput ENUM_TIMEFRAMES InpTf = PERIOD_M15;\n';
const PLAN = {
  expert: 'bot',
  runs: [
    { id: 'train', symbol: 'XAUUSDm', period: 'H1', from: '2026.01.05', to: '2026.06.30', delay: 'none' },
    { id: 'oos', symbol: 'XAUUSDm', period: 'H1', from: '2026.07.01', to: '2026.10.09', delay: 'random', inputs: { InpLots: 0.05 } },
  ],
};

/**
 * Mã hóa UTF-16 LE kèm BOM như file MT5 thật.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function utf16(text: string): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
}

/**
 * Project tạm có ea/bot.mq5 và kế hoạch, cùng thư mục MT5 giả.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function setup(plan: unknown = PLAN) {
  const root = mkdtempSync(join(tmpdir(), 'ea-runner-'));
  const projectDir = join(root, 'bot-project');
  const mt5Dir = join(root, 'mt5bt');
  mkdirSync(join(projectDir, 'ea'), { recursive: true });
  mkdirSync(join(projectDir, 'brain'), { recursive: true });
  mkdirSync(join(mt5Dir, 'Tester/Agent-1/logs'), { recursive: true });
  writeFileSync(join(projectDir, 'ea/bot.mq5'), SOURCE);
  writeFileSync(join(projectDir, 'brain/test-plan.json'), JSON.stringify(plan));
  const config: EaConfig = { mt5Dir, winePrefix: join(root, 'prefix'), wineApp: join(root, 'wine'), maxTesterRunsPerRound: 12, testerTimeoutMinutes: 1 };
  return { projectDir, mt5Dir, config, projectId: 'bot-project' };
}

type FakeBehavior = { compile?: string; skipReport?: boolean; drift?: Record<string, string> };

/**
 * Wine giả: biên dịch ghi log Result; terminal64 đọc ini, ghi report + log agent với header input (có thể lệch).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function fakeExec(mt5Dir: string, behavior: FakeBehavior = {}): { exec: Exec; calls: string[][] } {
  const calls: string[][] = [];
  const exec: Exec = async (_file, args) => {
    calls.push(args);
    if (args[0] === 'MetaEditor64.exe') {
      const logName = (args.find((item) => item.startsWith('/log:')) ?? '').slice(5);
      writeFileSync(join(mt5Dir, logName), utf16(behavior.compile ?? 'information: compiling\nResult: 0 errors, 0 warnings, 2652 ms elapsed\n'));
      return { code: 0, stdout: '', stderr: '' };
    }
    const iniName = (args.find((item) => item.startsWith('/config:')) ?? '').slice(8).replace('config\\', '');
    const ini = readFileSync(join(mt5Dir, 'config', iniName), 'utf8');
    const key = iniName.replace(/\.ini$/, '');
    if (!behavior.skipReport) writeFileSync(join(mt5Dir, 'res', `${key}.htm`), utf16(REPORT));
    const expert = /Expert=(.+)\.ex5/.exec(ini)?.[1] ?? '';
    const inputs = ini.split('[TesterInputs]\n')[1]?.trim().split('\n') ?? [];
    const drifted = inputs.map((line) => {
      const [name = '', value = ''] = line.split('=');
      return `CS\t0\t10:00:00.000\tTester\t  ${name}=${behavior.drift?.[name] ?? value}`;
    });
    const header = `CS\t0\t10:00:00.000\tTester\tXAUUSDm,H1: testing of Experts\\${expert}.ex5 from 2026.01.05 00:00 to 2026.06.30 00:00 started with inputs:`;
    writeFileSync(join(mt5Dir, 'Tester/Agent-1/logs/20261024.log'), utf16([header, ...drifted].join('\r\n')));
    return { code: 0, stdout: '', stderr: '' };
  };
  return { exec, calls };
}

test('expertStem / expertName đặt tên duy nhất theo project, không chứa ký tự lạ', () => {
  assert.equal(expertStem('gold-trend', 'ea/Bot 1.mq5'), 'gold_trend__Bot_1');
  assert.equal(expertName('gold_trend__bot'), 'dv2\\gold_trend__bot');
});

test('decodeText nhận UTF-16 có BOM và UTF-8', () => {
  assert.equal(decodeText(utf16('Result: 0 errors')), 'Result: 0 errors');
  assert.equal(decodeText(Buffer.from('xin chào')), 'xin chào');
});

test('compileExpert: sạch → ok; có lỗi → không ok kèm log; ngoài project hoặc không phải .mq5 → từ chối', async () => {
  const env = setup();
  const clean = fakeExec(env.mt5Dir);
  const ok = await compileExpert(env.projectDir, env.projectId, 'ea/bot.mq5', env.config, clean.exec);
  assert.equal(ok.ok, true);
  assert.deepEqual([ok.errors, ok.warnings], [0, 0]);
  assert.equal(existsSync(join(env.mt5Dir, 'MQL5/Experts/dv2/bot_project__bot.mq5')), true);
  assert.ok(clean.calls[0]?.includes('/compile:MQL5\\Experts\\dv2\\bot_project__bot.mq5'));
  assert.equal(readdirSync(env.mt5Dir).some((name) => name.endsWith('.compile.log')), false);

  const broken = await compileExpert(env.projectDir, env.projectId, 'ea/bot.mq5', env.config, fakeExec(env.mt5Dir, { compile: "ea.mq5(10,5) : error 123: ';' - unexpected token\nResult: 1 errors, 2 warnings\n" }).exec);
  assert.equal(broken.ok, false);
  assert.deepEqual([broken.errors, broken.warnings], [1, 2]);
  assert.match(broken.message, /unexpected token/);

  assert.match((await compileExpert(env.projectDir, env.projectId, '../x.mq5', env.config, clean.exec)).message, /nằm trong project/);
  assert.match((await compileExpert(env.projectDir, env.projectId, 'ea/bot.txt', env.config, clean.exec)).message, /nằm trong project/);
  assert.match((await compileExpert(env.projectDir, env.projectId, 'ea/none.mq5', env.config, clean.exec)).message, /Không có file/);
});

test('loadPlan: thiếu file, JSON hỏng, sai cấu trúc, hợp lệ', () => {
  const env = setup();
  assert.deepEqual(loadPlan(env.projectDir, 12).errors, []);
  writeFileSync(join(env.projectDir, 'brain/test-plan.json'), '{không phải json');
  assert.match(loadPlan(env.projectDir, 12).errors[0] ?? '', /không phải JSON hợp lệ/);
  writeFileSync(join(env.projectDir, 'brain/test-plan.json'), '[]');
  assert.match(loadPlan(env.projectDir, 12).errors[0] ?? '', /sai cấu trúc/);
  assert.match(loadPlan(join(env.projectDir, 'x'), 12).errors[0] ?? '', /Thiếu brain\/test-plan\.json/);
});

test('prepareRuns: ghi ini đủ mọi input, ghi đè đúng chỗ; id đã có kết quả thì từ chối; tên input lạ thì không ghi gì', () => {
  const env = setup();
  const outcome = prepareRuns(env.projectDir, env.projectId, env.config);
  assert.equal(outcome.ok, true);
  const oos = readFileSync(join(env.projectDir, 'results/oos.ini'), 'utf8');
  assert.match(oos, /Expert=dv2\\bot_project__bot\.ex5/);
  assert.match(oos, /InpLots=0\.05\nInpPeriod=14\nInpTf=15\n/);
  assert.match(readFileSync(join(env.projectDir, 'results/train.ini'), 'utf8'), /InpLots=0\.02/);

  writeFileSync(join(env.projectDir, 'results/train.json'), '{}');
  assert.match(prepareRuns(env.projectDir, env.projectId, env.config).summary.join(), /Đã có kết quả cho id: train/);

  const bad = setup({ ...PLAN, runs: [{ ...PLAN.runs[0], inputs: { InpLotz: 1 } }] });
  const refused = prepareRuns(bad.projectDir, bad.projectId, bad.config);
  assert.equal(refused.ok, false);
  assert.equal(existsSync(join(bad.projectDir, 'results')), false);
});

test('runPlan: biên dịch lại, chạy từng lần, ghi results/*.json hợp lệ, xóa log agent', async () => {
  const env = setup();
  mkdirSync(join(env.mt5Dir, 'res'), { recursive: true });
  const { exec, calls } = fakeExec(env.mt5Dir);
  const outcome = await runPlan(env.projectDir, env.projectId, env.config, exec, () => new Date('2026-10-24T00:00:00Z'));
  assert.equal(outcome.ok, true, outcome.summary.join('\n'));
  assert.equal(calls.filter((args) => args[0] === 'terminal64.exe').length, 2);
  assert.equal(calls[0]?.[0], 'MetaEditor64.exe');
  const oos = JSON.parse(readFileSync(join(env.projectDir, 'results/oos.json'), 'utf8'));
  assert.equal(oos.valid, true);
  assert.equal(oos.condition.delay, 'random');
  assert.equal(oos.condition.deposit, 1000);
  assert.equal(oos.metrics.profitFactor, 0.88);
  assert.equal(oos.blown, true);
  assert.equal(oos.finishedAt, '2026-10-24T00:00:00.000Z');
  assert.equal(existsSync(join(env.projectDir, 'results/oos.ini')), true);
  assert.equal(readdirSync(join(env.mt5Dir, 'Tester/Agent-1/logs')).length, 0);
  assert.match(outcome.summary[0] ?? '', /train: hợp lệ.*CHÁY TÀI KHOẢN/);
});

test('runPlan: tester kế thừa input cũ (header lệch ini) → kết quả KHÔNG HỢP LỆ, ghi rõ input lệch', async () => {
  const env = setup();
  mkdirSync(join(env.mt5Dir, 'res'), { recursive: true });
  const { exec } = fakeExec(env.mt5Dir, { drift: { InpLots: '0.2' } });
  const outcome = await runPlan(env.projectDir, env.projectId, env.config, exec);
  assert.equal(outcome.ok, false);
  const oos = JSON.parse(readFileSync(join(env.projectDir, 'results/oos.json'), 'utf8'));
  assert.equal(oos.valid, false);
  assert.match(oos.invalidReasons.join(), /InpLots: ini=0\.05, tester=0\.2/);
});

test('runPlan: compile lỗi thì không chạy tester; không có report thì dừng và báo', async () => {
  const env = setup();
  mkdirSync(join(env.mt5Dir, 'res'), { recursive: true });
  const broken = fakeExec(env.mt5Dir, { compile: 'Result: 3 errors, 0 warnings\n' });
  const first = await runPlan(env.projectDir, env.projectId, env.config, broken.exec);
  assert.equal(first.ok, false);
  assert.match(first.summary[0] ?? '', /Biên dịch lại trước khi chạy thất bại/);
  assert.equal(broken.calls.some((args) => args[0] === 'terminal64.exe'), false);

  const noReport = fakeExec(env.mt5Dir, { skipReport: true });
  const second = await runPlan(env.projectDir, env.projectId, env.config, noReport.exec);
  assert.equal(second.ok, false);
  assert.match(second.summary[0] ?? '', /train: KHÔNG có report/);
  assert.equal(noReport.calls.filter((args) => args[0] === 'terminal64.exe').length, 1);
});

test('purgeAgentLogs chỉ xóa .log trong Tester/Agent-*/logs', () => {
  const env = setup();
  writeFileSync(join(env.mt5Dir, 'Tester/Agent-1/logs/a.log'), 'x');
  writeFileSync(join(env.mt5Dir, 'Tester/Agent-1/logs/keep.txt'), 'x');
  writeFileSync(join(env.mt5Dir, 'other.log'), 'x');
  assert.equal(purgeAgentLogs(env.mt5Dir), 1);
  assert.equal(existsSync(join(env.mt5Dir, 'Tester/Agent-1/logs/keep.txt')), true);
  assert.equal(existsSync(join(env.mt5Dir, 'other.log')), true);
});
