export const TESTER_STANDARD = { deposit: 1000, leverage: 2000, model: 4, visual: 0, currency: 'USD' } as const;

export type RunDelay = 'none' | 'random';
export type InputValue = string | number | boolean;

export type TesterRun = {
  id: string;
  symbol: string;
  period: string;
  from: string;
  to: string;
  delay: RunDelay;
  inputs?: Record<string, InputValue>;
};

export type TestPlan = {
  expert: string;
  runs: TesterRun[];
};

export type MqlInput = { type: string; name: string; defaultValue: string };

export type ReportMetrics = {
  initialDeposit: number | null;
  netProfit: number | null;
  grossProfit: number | null;
  grossLoss: number | null;
  profitFactor: number | null;
  expectedPayoff: number | null;
  totalTrades: number | null;
  winRatePercent: number | null;
  maxEquityDrawdown: number | null;
  maxEquityDrawdownPercent: number | null;
  maxBalanceDrawdownPercent: number | null;
  marginLevelPercent: number | null;
  maxConsecutiveLosses: number | null;
  historyQuality: string | null;
  ticks: number | null;
};

export type TesterResult = {
  runId: string;
  expert: string;
  valid: boolean;
  invalidReasons: string[];
  blown: boolean;
  condition: { symbol: string; period: string; from: string; to: string; delay: RunDelay; deposit: number; leverage: number; model: number };
  metrics: ReportMetrics;
  finishedAt: string;
};

const TIMEFRAME_CODES: Record<string, number> = {
  PERIOD_CURRENT: 0,
  PERIOD_M1: 1,
  PERIOD_M2: 2,
  PERIOD_M3: 3,
  PERIOD_M4: 4,
  PERIOD_M5: 5,
  PERIOD_M6: 6,
  PERIOD_M10: 10,
  PERIOD_M12: 12,
  PERIOD_M15: 15,
  PERIOD_M20: 20,
  PERIOD_M30: 30,
  PERIOD_H1: 16385,
  PERIOD_H2: 16386,
  PERIOD_H3: 16387,
  PERIOD_H4: 16388,
  PERIOD_H6: 16390,
  PERIOD_H8: 16392,
  PERIOD_H12: 16396,
  PERIOD_D1: 16408,
  PERIOD_W1: 32769,
  PERIOD_MN1: 49153,
};

const BUILTIN_ENUMS: Record<string, number> = {
  ...TIMEFRAME_CODES,
  PRICE_CLOSE: 1,
  PRICE_OPEN: 2,
  PRICE_HIGH: 3,
  PRICE_LOW: 4,
  PRICE_MEDIAN: 5,
  PRICE_TYPICAL: 6,
  PRICE_WEIGHTED: 7,
  MODE_SMA: 0,
  MODE_EMA: 1,
  MODE_SMMA: 2,
  MODE_LWMA: 3,
};

const BOOL_VALUES = new Set(['true', 'false']);
const INPUT_LINE = /^\s*input\s+(?!group\b)([A-Za-z_][\w:<>]*)\s+([A-Za-z_]\w*)\s*=\s*([^;]+?)\s*;/;
const ENUM_BLOCK = /\benum\s+([A-Za-z_]\w*)\s*\{([^}]*)\}/g;
const NUMBER = /^[+-]?\d+(\.\d+)?$/;
const REPORT_PAIR = /<td[^>]*>\s*([^<>]+?:)\s*<\/td>\s*<td[^>]*>\s*<b>([^<]*)<\/b>/g;
const SPACE_CHARS = /[\s ]/g;
const BLOWN_DRAWDOWN_PERCENT = 99;
const PERCENT = 100;
const MIN_TICKS_FOR_REAL_MODEL = 1;

/**
 * Mã số của khung thời gian dùng trong ini (M5=5, H1=16385, H4=16388); tên lạ trả undefined.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function timeframeCode(name: string): number | undefined {
  return TIMEFRAME_CODES[`PERIOD_${name.toUpperCase()}`];
}

/**
 * Các enum tự định nghĩa trong mã nguồn (`enum NAME { A=0, B, C=5 }`) → bảng tên → số.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parseCustomEnums(source: string): Record<string, number> {
  const values: Record<string, number> = {};
  for (const block of source.matchAll(ENUM_BLOCK)) {
    let next = 0;
    for (const entry of (block[2] ?? '').split(',')) {
      const [name, assigned] = entry.split('=').map((part) => part.replace(/\/\/.*$/gm, '').trim());
      if (!name) continue;
      if (assigned !== undefined && NUMBER.test(assigned)) next = Number(assigned);
      values[name] = next;
      next += 1;
    }
  }
  return values;
}

/**
 * Mọi dòng `input <kiểu> <Tên> = <mặc định>;` của EA (bỏ `input group`, bỏ chú thích cuối dòng).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parseMqlInputs(source: string): MqlInput[] {
  const inputs: MqlInput[] = [];
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    const match = INPUT_LINE.exec(line);
    if (match?.[1] && match[2] && match[3] !== undefined) {
      inputs.push({ type: match[1], name: match[2], defaultValue: match[3] });
    }
  }
  return inputs;
}

/**
 * Giá trị mặc định của một input → chuỗi ghi vào ini. Số, bool, chuỗi, enum biết được thì đổi;
 * biểu thức hay enum lạ thì ném lỗi để người viết kế hoạch đặt giá trị tường minh (không đoán).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function resolveDefault(input: MqlInput, customEnums: Record<string, number>): string {
  const raw = input.defaultValue.trim();
  if (NUMBER.test(raw) || BOOL_VALUES.has(raw)) return raw;
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  const enumValue = customEnums[raw] ?? BUILTIN_ENUMS[raw];
  if (enumValue !== undefined) return String(enumValue);
  throw new Error(`Không giải mã được mặc định của input ${input.name} = ${raw}; hãy đặt giá trị tường minh trong brain/test-plan.json`);
}

/**
 * Chuẩn hóa giá trị người dùng đặt: bool/số giữ nguyên, tên khung (M15) đổi sang mã số cho input enum khung.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function formatOverride(input: MqlInput, value: InputValue): string {
  if (input.type === 'ENUM_TIMEFRAMES' && typeof value === 'string') {
    const code = timeframeCode(value) ?? BUILTIN_ENUMS[value];
    if (code === undefined) throw new Error(`Khung thời gian không hợp lệ cho ${input.name}: ${value}`);
    return String(code);
  }
  return String(value);
}

/**
 * Giá trị đầy đủ của MỌI input cho một lần chạy: mặc định trong mã nguồn, ghi đè bằng `run.inputs`.
 * Ghi đè input không tồn tại là lỗi (gõ nhầm tên sẽ âm thầm bị bỏ qua nếu không chặn).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function resolveInputs(source: string, overrides: Record<string, InputValue> = {}): Record<string, string> {
  const declared = parseMqlInputs(source);
  const customEnums = parseCustomEnums(source);
  const unknown = Object.keys(overrides).filter((name) => !declared.some((input) => input.name === name));
  if (unknown.length > 0) throw new Error(`Input không có trong EA: ${unknown.join(', ')}`);
  const resolved: Record<string, string> = {};
  for (const input of declared) {
    const override = overrides[input.name];
    resolved[input.name] = override === undefined ? resolveDefault(input, customEnums) : formatOverride(input, override);
  }
  return resolved;
}

/**
 * File ini tester theo chuẩn DV2: vốn 1000, real ticks, leverage 2000, không đồ họa, ghi đủ mọi input.
 * Vốn / model / leverage không cho kế hoạch ghi đè.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function buildTesterIni(expertName: string, run: TesterRun, inputs: Record<string, string>): string {
  const lines = [
    '[Tester]',
    `Expert=${expertName}.ex5`,
    `Symbol=${run.symbol}`,
    `Period=${run.period}`,
    'Optimization=0',
    `Model=${TESTER_STANDARD.model}`,
    `FromDate=${run.from}`,
    `ToDate=${run.to}`,
    'ForwardMode=0',
    `Deposit=${TESTER_STANDARD.deposit}`,
    `Currency=${TESTER_STANDARD.currency}`,
    `Leverage=${TESTER_STANDARD.leverage}`,
    `ExecutionMode=${run.delay === 'random' ? -1 : 0}`,
    `Visual=${TESTER_STANDARD.visual}`,
    `Report=res\\${run.id}`,
    'ReplaceReport=1',
    'ShutdownTerminal=1',
    '[TesterInputs]',
    ...Object.entries(inputs).map(([name, value]) => `${name}=${value}`),
  ];
  return `${lines.join('\n')}\n`;
}

/**
 * Kiểm tra kế hoạch: id duy nhất, định dạng ngày, số lần chạy không vượt ngân sách.
 * Trả danh sách lỗi (rỗng = hợp lệ).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function validatePlan(plan: unknown, maxRuns: number): string[] {
  if (!isPlan(plan)) return ['test-plan.json sai cấu trúc: cần { expert: string, runs: [...] }'];
  const errors: string[] = [];
  const seen = new Set<string>();
  if (plan.runs.length === 0) errors.push('Kế hoạch không có lần chạy nào');
  if (plan.runs.length > maxRuns) errors.push(`Vượt ngân sách: ${plan.runs.length} lần chạy > ${maxRuns} cho mỗi vòng`);
  for (const run of plan.runs) {
    if (!/^[A-Za-z0-9_-]+$/.test(run.id)) errors.push(`id lần chạy không hợp lệ: ${run.id}`);
    if (seen.has(run.id)) errors.push(`id lần chạy trùng: ${run.id}`);
    seen.add(run.id);
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(run.from) || !/^\d{4}\.\d{2}\.\d{2}$/.test(run.to)) {
      errors.push(`${run.id}: ngày phải dạng YYYY.MM.DD`);
    }
    if (run.delay !== 'none' && run.delay !== 'random') errors.push(`${run.id}: delay phải là none hoặc random`);
  }
  return errors;
}

/**
 * Nhận diện cấu trúc kế hoạch chạy thử.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
function isPlan(value: unknown): value is TestPlan {
  if (typeof value !== 'object' || value === null) return false;
  const plan = value as Partial<TestPlan>;
  return (
    typeof plan.expert === 'string' &&
    /^[A-Za-z0-9_-]+$/.test(plan.expert) &&
    Array.isArray(plan.runs) &&
    plan.runs.every(
      (run) =>
        typeof run === 'object' &&
        run !== null &&
        typeof run.id === 'string' &&
        typeof run.symbol === 'string' &&
        typeof run.period === 'string' &&
        typeof run.from === 'string' &&
        typeof run.to === 'string',
    )
  );
}

/**
 * Các cặp "Nhãn: giá trị" trong báo cáo HTML của MT5.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parseReportPairs(html: string): Map<string, string> {
  const pairs = new Map<string, string>();
  for (const match of html.matchAll(REPORT_PAIR)) {
    const label = (match[1] ?? '').replace(/:$/, '').trim();
    if (label && !pairs.has(label)) pairs.set(label, (match[2] ?? '').trim());
  }
  return pairs;
}

/**
 * Số đầu tiên trong chuỗi kiểu "1 046.60 (100.05%)" hoặc "-1 000.55" (bỏ khoảng trắng nghìn).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function firstNumber(text: string | undefined): number | null {
  if (text === undefined) return null;
  const match = /^[+-]?[\d\s ]+(\.\d+)?/.exec(text.trim());
  if (!match) return null;
  const parsed = Number(match[0].replace(SPACE_CHARS, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Số trong ngoặc của chuỗi "1 046.60 (100.05%)" → 100.05.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parenNumber(text: string | undefined): number | null {
  const match = text ? /\(([+-]?[\d\s .]+)%?\)/.exec(text) : null;
  if (!match?.[1]) return null;
  const parsed = Number(match[1].replace(SPACE_CHARS, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Chỉ số từ báo cáo tester (nhãn tiếng Anh của MT5 build 6230).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parseReportMetrics(html: string): ReportMetrics {
  const pairs = parseReportPairs(html);
  const get = (label: string) => pairs.get(label);
  const percentOfBalance = get('Balance Drawdown Relative');
  return {
    initialDeposit: firstNumber(get('Initial Deposit')),
    netProfit: firstNumber(get('Total Net Profit')),
    grossProfit: firstNumber(get('Gross Profit')),
    grossLoss: firstNumber(get('Gross Loss')),
    profitFactor: firstNumber(get('Profit Factor')),
    expectedPayoff: firstNumber(get('Expected Payoff')),
    totalTrades: firstNumber(get('Total Trades')),
    winRatePercent: parenNumber(get('Profit Trades (% of total)')),
    maxEquityDrawdown: firstNumber(get('Equity Drawdown Maximal')),
    maxEquityDrawdownPercent: parenNumber(get('Equity Drawdown Maximal')),
    maxBalanceDrawdownPercent: percentOfBalance ? firstNumber(percentOfBalance) : null,
    marginLevelPercent: firstNumber(get('Margin Level')),
    maxConsecutiveLosses: firstNumber(get('Maximum consecutive losses ($)')),
    historyQuality: get('History Quality') ?? null,
    ticks: firstNumber(get('Ticks')),
  };
}

/**
 * Giá trị input trong khối "started with inputs" gần nhất của EA trong log tester
 * (dòng `  Tên=Giá trị`; bỏ dòng tiêu đề nhóm `=== ... ====`). Không thấy khối thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function parseLogInputs(logText: string, expertName: string): Record<string, string> | null {
  const lines = logText.replace(/\r/g, '').split('\n');
  const marker = `Experts\\${expertName}.ex5`;
  let start = -1;
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index] ?? '';
    if (line.includes('started with inputs') && line.includes(marker)) {
      start = index;
      break;
    }
  }
  if (start < 0) return null;
  const inputs: Record<string, string> = {};
  for (let index = start + 1; index < lines.length; index++) {
    const body = (lines[index] ?? '').split('\t').pop() ?? '';
    if (/^\s{2}=+\s/.test(body)) continue;
    const entry = /^\s{2}([A-Za-z_]\w*)=(.*)$/.exec(body);
    if (!entry?.[1]) break;
    inputs[entry[1]] = (entry[2] ?? '').trim();
  }
  return inputs;
}

/**
 * Hai giá trị input coi là bằng nhau: so như số khi cả hai là số (0.10 = 0.1), còn lại so chuỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function sameInputValue(expected: string, actual: string): boolean {
  if (NUMBER.test(expected) && NUMBER.test(actual)) return Number(expected) === Number(actual);
  return expected === actual;
}

/**
 * Đối chiếu input đã ghi trong ini với input tester thực sự dùng (tester có thể kế thừa giá trị cũ).
 * Trả danh sách lệch (rỗng = khớp); không có khối log thì coi là không kiểm chứng được.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function inputMismatches(expected: Record<string, string>, actual: Record<string, string> | null): string[] {
  if (!actual) return ['Không tìm thấy khối "started with inputs" trong log tester — không kiểm chứng được input'];
  return Object.entries(expected)
    .filter(([name, value]) => actual[name] === undefined || !sameInputValue(value, actual[name]))
    .map(([name, value]) => `${name}: ini=${value}, tester=${actual[name] ?? '(thiếu)'}`);
}

/**
 * Kết quả cuối của một lần chạy: hợp lệ khi input khớp, có report, vốn đúng chuẩn và dữ liệu real ticks;
 * cháy tài khoản khi drawdown ≥ 99% hoặc lỗ ≥ 99% vốn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function buildResult(expert: string, run: TesterRun, metrics: ReportMetrics, mismatches: string[], finishedAt: string): TesterResult {
  const invalidReasons = [...mismatches];
  if (metrics.initialDeposit !== TESTER_STANDARD.deposit) invalidReasons.push(`Vốn trong report ${metrics.initialDeposit ?? '?'} ≠ ${TESTER_STANDARD.deposit}`);
  if (!metrics.historyQuality?.toLowerCase().includes('real ticks')) invalidReasons.push(`Dữ liệu không phải real ticks: ${metrics.historyQuality ?? '?'}`);
  if (metrics.ticks === null || metrics.ticks < MIN_TICKS_FOR_REAL_MODEL) invalidReasons.push('Report không có số tick');
  const lossPercent = metrics.netProfit === null ? 0 : (-metrics.netProfit / TESTER_STANDARD.deposit) * PERCENT;
  const blown = (metrics.maxBalanceDrawdownPercent ?? 0) >= BLOWN_DRAWDOWN_PERCENT || lossPercent >= BLOWN_DRAWDOWN_PERCENT;
  return {
    runId: run.id,
    expert,
    valid: invalidReasons.length === 0,
    invalidReasons,
    blown,
    condition: {
      symbol: run.symbol,
      period: run.period,
      from: run.from,
      to: run.to,
      delay: run.delay,
      deposit: TESTER_STANDARD.deposit,
      leverage: TESTER_STANDARD.leverage,
      model: TESTER_STANDARD.model,
    },
    metrics,
    finishedAt,
  };
}
