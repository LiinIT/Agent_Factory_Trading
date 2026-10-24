import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildResult,
  buildTesterIni,
  inputMismatches,
  parseCustomEnums,
  parseLogInputs,
  parseMqlInputs,
  parseReportMetrics,
  resolveInputs,
  timeframeCode,
  validatePlan,
  type TesterRun,
} from '../src/ea-tester.ts';

const SOURCE = `
enum ENUM_EA_MODE { EA_AUTO=0, EA_MANUAL=1, EA_PAUSE=2, EA_RISK=3 };
enum ENUM_PROTECTION_MODE { PROTECT_ATR_RR=0, PROTECT_WICK_RR, PROTECT_WICK_BAND };
input group "2. Orders"
input double InpLots = 0.02;
input int InpMaxOpenPositions = 5; // Own positions; 0 = unlimited
input bool InpUseSMA = true;
input ENUM_PROTECTION_MODE InpProtectionMode = PROTECT_WICK_RR;
input ENUM_EA_MODE InpStartMode = EA_AUTO;
input ENUM_TIMEFRAMES InpStartTimeframe = PERIOD_M5;
input ENUM_APPLIED_PRICE InpSource = PRICE_CLOSE;
input string InpComment = "dv2 bot";
input ulong InpMagic = 210021;
`;

const RUN: TesterRun = { id: 'oos', symbol: 'XAUUSDm', period: 'M15', from: '2026.07.01', to: '2026.10.09', delay: 'random' };

test('parseMqlInputs đọc đủ input, bỏ input group và chú thích cuối dòng', () => {
  const inputs = parseMqlInputs(SOURCE);
  assert.deepEqual(inputs.map((item) => item.name), ['InpLots', 'InpMaxOpenPositions', 'InpUseSMA', 'InpProtectionMode', 'InpStartMode', 'InpStartTimeframe', 'InpSource', 'InpComment', 'InpMagic']);
  assert.equal(inputs[1]?.defaultValue, '5');
});

test('parseCustomEnums tính giá trị ngầm định khi enum không gán số', () => {
  assert.deepEqual(parseCustomEnums(SOURCE), { EA_AUTO: 0, EA_MANUAL: 1, EA_PAUSE: 2, EA_RISK: 3, PROTECT_ATR_RR: 0, PROTECT_WICK_RR: 1, PROTECT_WICK_BAND: 2 });
});

test('resolveInputs: mặc định đổi enum sang số, ghi đè tên khung sang mã số', () => {
  const inputs = resolveInputs(SOURCE, { InpLots: 0.05, InpStartTimeframe: 'H1' });
  assert.equal(inputs.InpLots, '0.05');
  assert.equal(inputs.InpProtectionMode, '1');
  assert.equal(inputs.InpStartMode, '0');
  assert.equal(inputs.InpStartTimeframe, '16385');
  assert.equal(inputs.InpSource, '1');
  assert.equal(inputs.InpComment, 'dv2 bot');
  assert.equal(inputs.InpUseSMA, 'true');
});

test('resolveInputs từ chối tên input lạ và mặc định không giải mã được', () => {
  assert.throws(() => resolveInputs(SOURCE, { InpLotz: 1 }), /Input không có trong EA: InpLotz/);
  assert.throws(() => resolveInputs('input color InpColor = clrRed;', {}), /Không giải mã được mặc định của input InpColor/);
  assert.equal(resolveInputs('input color InpColor = clrRed;', { InpColor: 255 }).InpColor, '255');
});

test('mã số khung thời gian khớp bảng đã ghi trong memory (M5=5, H1=16385, H4=16388)', () => {
  assert.deepEqual([timeframeCode('M5'), timeframeCode('H1'), timeframeCode('H4'), timeframeCode('M7')], [5, 16385, 16388, undefined]);
});

test('buildTesterIni cố định chuẩn DV2: vốn 1000, real ticks, leverage 2000, không đồ họa; trễ ngẫu nhiên = -1', () => {
  const ini = buildTesterIni('dv2\\bot__x', RUN, { InpLots: '0.02' });
  assert.match(ini, /^\[Tester\]\nExpert=dv2\\bot__x\.ex5\nSymbol=XAUUSDm\nPeriod=M15\n/);
  for (const line of ['Model=4', 'Deposit=1000', 'Leverage=2000', 'Visual=0', 'ExecutionMode=-1', 'ShutdownTerminal=1', 'FromDate=2026.07.01', 'ToDate=2026.10.09', 'Report=res\\oos', '[TesterInputs]\nInpLots=0.02']) {
    assert.ok(ini.includes(line), line);
  }
  assert.ok(buildTesterIni('x', { ...RUN, delay: 'none' }, {}).includes('ExecutionMode=0'));
});

test('validatePlan: id trùng, ngày sai, vượt ngân sách, cấu trúc sai', () => {
  const ok = { expert: 'bot', runs: [RUN] };
  assert.deepEqual(validatePlan(ok, 12), []);
  assert.match(validatePlan({ expert: 'bot', runs: [RUN, RUN] }, 12).join(), /id lần chạy trùng: oos/);
  assert.match(validatePlan({ expert: 'bot', runs: [{ ...RUN, from: '01/07/2026' }] }, 12).join(), /YYYY\.MM\.DD/);
  assert.match(validatePlan({ expert: 'bot', runs: [RUN, { ...RUN, id: 'b' }] }, 1).join(), /Vượt ngân sách: 2 lần chạy > 1/);
  assert.match(validatePlan({ expert: '../bot', runs: [RUN] }, 12).join(), /sai cấu trúc/);
  assert.match(validatePlan({ expert: 'bot', runs: [{ ...RUN, delay: 'x' }] }, 12).join(), /delay phải là none hoặc random/);
});

test('parseReportMetrics đọc report MT5 thật (EA cháy tài khoản: vốn 1000, lỗ 1000.55)', () => {
  const metrics = parseReportMetrics(readFileSync(join(import.meta.dirname, 'fixtures/tester-report.html'), 'utf8'));
  assert.equal(metrics.initialDeposit, 1000);
  assert.equal(metrics.netProfit, -1000.55);
  assert.equal(metrics.profitFactor, 0.88);
  assert.equal(metrics.totalTrades, 3144);
  assert.equal(metrics.maxEquityDrawdown, 1046.6);
  assert.equal(metrics.maxEquityDrawdownPercent, 100.05);
  assert.equal(metrics.maxBalanceDrawdownPercent, 100.05);
  assert.equal(metrics.marginLevelPercent, 2.79);
  assert.equal(metrics.maxConsecutiveLosses, 11);
  assert.equal(metrics.historyQuality, '100% real ticks');
  assert.equal(metrics.ticks, 19560854);
  assert.ok((metrics.winRatePercent ?? 0) > 0);
});

const LOG = [
  'CS\t0\t10:02:03.433\tTester\tXAUUSDm,M1: testing of Experts\\dv2\\old.ex5 from 2026.01.05 00:00 to 2026.10.11 00:00 started with inputs:',
  'CS\t0\t10:02:03.433\tTester\t  InpLots=0.01',
  'CS\t0\t10:02:09.910\tTrade\t2026.01.05 00:00:06   buy stop 0.01',
  'CS\t0\t12:24:42.236\tTester\tXAUUSDm,M15: testing of Experts\\dv2\\bot__x.ex5 from 2026.07.01 00:00 to 2026.10.09 00:00 started with inputs:',
  'CS\t0\t12:24:42.236\tTester\t  === ORDERS ====',
  'CS\t0\t12:24:42.236\tTester\t  InpLots=0.050',
  'CS\t0\t12:24:42.236\tTester\t  InpUseSMA=true',
  'CS\t0\t12:24:43.000\tTrade\t2026.07.01 00:00:06   buy',
].join('\r\n');

test('parseLogInputs lấy khối input gần nhất của đúng EA, bỏ tiêu đề nhóm', () => {
  assert.deepEqual(parseLogInputs(LOG, 'dv2\\bot__x'), { InpLots: '0.050', InpUseSMA: 'true' });
  assert.equal(parseLogInputs(LOG, 'dv2\\khong-co'), null);
});

test('inputMismatches: số bằng nhau khác cách viết vẫn khớp; thiếu hoặc lệch thì báo; không có khối log thì không kiểm chứng được', () => {
  assert.deepEqual(inputMismatches({ InpLots: '0.05', InpUseSMA: 'true' }, { InpLots: '0.050', InpUseSMA: 'true' }), []);
  assert.deepEqual(inputMismatches({ InpLots: '0.05' }, { InpLots: '0.2' }), ['InpLots: ini=0.05, tester=0.2']);
  assert.deepEqual(inputMismatches({ InpLots: '0.05' }, {}), ['InpLots: ini=0.05, tester=(thiếu)']);
  assert.match(inputMismatches({}, null)[0] ?? '', /không kiểm chứng được input/);
});

test('buildResult: report thật của EA cháy → hợp lệ, blown; input lệch hoặc vốn sai → không hợp lệ', () => {
  const metrics = parseReportMetrics(readFileSync(join(import.meta.dirname, 'fixtures/tester-report.html'), 'utf8'));
  const good = buildResult('bot', RUN, metrics, [], '2026-10-24T00:00:00.000Z');
  assert.equal(good.valid, true);
  assert.equal(good.blown, true);
  assert.deepEqual(good.condition, { symbol: 'XAUUSDm', period: 'M15', from: '2026.07.01', to: '2026.10.09', delay: 'random', deposit: 1000, leverage: 2000, model: 4 });
  const drifted = buildResult('bot', RUN, metrics, ['InpLots: ini=0.05, tester=0.2'], 't');
  assert.equal(drifted.valid, false);
  const wrongDeposit = buildResult('bot', RUN, { ...metrics, initialDeposit: 100 }, [], 't');
  assert.match(wrongDeposit.invalidReasons.join(), /Vốn trong report 100 ≠ 1000/);
  const notReal = buildResult('bot', RUN, { ...metrics, historyQuality: '90% every tick' }, [], 't');
  assert.match(notReal.invalidReasons.join(), /không phải real ticks/);
});
