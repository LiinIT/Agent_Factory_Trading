import { execFile } from 'node:child_process';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import {
  buildResult,
  buildTesterIni,
  inputMismatches,
  parseLogInputs,
  parseReportMetrics,
  resolveInputs,
  validatePlan,
  type TesterResult,
  type TestPlan,
} from './ea-tester.ts';
import { log } from './logger.ts';

const MS_PER_MINUTE = 60_000;
const COMPILE_TIMEOUT_MS = 3 * MS_PER_MINUTE;
const LOG_TAIL_BYTES = 16 * 1024 * 1024;
const EXPERT_SUBDIR = 'dv2';
const COMPILE_RESULT = /Result:\s*(\d+)\s+errors?,\s*(\d+)\s+warnings?/;
const UTF16_BOM_LE = [0xff, 0xfe];
const PLAN_FILE = 'brain/test-plan.json';
const RESULTS_DIR = 'results';

export type EaConfig = {
  mt5Dir: string;
  winePrefix: string;
  wineApp: string;
  maxTesterRunsPerRound: number;
  testerTimeoutMinutes: number;
};

export type ExecOptions = { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number };
export type ExecResult = { code: number | null; stdout: string; stderr: string };
export type Exec = (file: string, args: string[], options: ExecOptions) => Promise<ExecResult>;

export type CompileResult = {
  ok: boolean;
  errors: number | null;
  warnings: number | null;
  message: string;
};

export type PlanOutcome = {
  ok: boolean;
  summary: string[];
  results: TesterResult[];
};

/**
 * Chạy một lệnh ngoài, không ném lỗi khi exit khác 0 (trả mã thoát để bên gọi quyết định).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export const runExec: Exec = (file, args, options) =>
  new Promise((resolvePromise) => {
    execFile(file, args, { cwd: options.cwd, env: options.env, timeout: options.timeoutMs, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
      resolvePromise({ code, stdout, stderr });
    });
  });

/**
 * Tên file EA trong thư mục Experts của bản portable: `<project>__<tên file>`, không xung đột giữa các project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function expertStem(projectId: string, sourceFile: string): string {
  const name = sourceFile.replace(/^.*[\\/]/, '').replace(/\.mq5$/i, '');
  return `${projectId.replace(/[^A-Za-z0-9]+/g, '_')}__${name.replace(/[^A-Za-z0-9_]+/g, '_')}`;
}

/**
 * Tên EA dùng trong ini và log tester: `dv2\<stem>`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function expertName(stem: string): string {
  return `${EXPERT_SUBDIR}\\${stem}`;
}

/**
 * Môi trường chạy wine cho bản MT5 portable.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function wineEnv(config: EaConfig): NodeJS.ProcessEnv {
  return { ...process.env, WINEPREFIX: config.winePrefix, DYLD_FALLBACK_LIBRARY_PATH: `${config.wineApp}/lib:/usr/lib` };
}

/**
 * Giải mã file log/report của MT5: UTF-16 LE khi có BOM hoặc nhiều byte 0, ngược lại UTF-8.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function decodeText(buffer: Buffer): string {
  const hasBom = buffer.length >= 2 && buffer[0] === UTF16_BOM_LE[0] && buffer[1] === UTF16_BOM_LE[1];
  const sample = buffer.subarray(0, Math.min(buffer.length, 64));
  const zeros = sample.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  return hasBom || zeros > sample.length / 4 ? buffer.toString('utf16le').replace(/^\uFEFF/, '') : buffer.toString('utf8');
}

/**
 * Đọc phần cuối của file (đầu đọc căn chẵn byte để giải mã UTF-16 không lệch).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function readTail(path: string, maxBytes: number = LOG_TAIL_BYTES): Buffer {
  const size = statSync(path).size;
  const start = Math.max(0, size - maxBytes) & ~1;
  const buffer = Buffer.alloc(size - start);
  const fd = openSync(path, 'r');
  try {
    readSync(fd, buffer, 0, buffer.length, start);
  } finally {
    closeSync(fd);
  }
  return buffer;
}

/**
 * Biên dịch một file `.mq5` của project bằng MetaEditor trong bản portable: chép vào Experts/dv2,
 * chạy trình biên dịch, đọc dòng `Result:`. Chỉ nhận file `.mq5` nằm trong project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export async function compileExpert(
  projectDir: string,
  projectId: string,
  sourceRelative: string,
  config: EaConfig,
  exec: Exec = runExec,
): Promise<CompileResult> {
  const source = resolve(projectDir, sourceRelative);
  if (relative(projectDir, source).startsWith('..') || !source.toLowerCase().endsWith('.mq5')) {
    return { ok: false, errors: null, warnings: null, message: `Chỉ biên dịch file .mq5 nằm trong project: ${sourceRelative}` };
  }
  if (!existsSync(source)) return { ok: false, errors: null, warnings: null, message: `Không có file: ${sourceRelative}` };
  const stem = expertStem(projectId, sourceRelative);
  const targetDir = join(config.mt5Dir, 'MQL5', 'Experts', EXPERT_SUBDIR);
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(source, join(targetDir, `${stem}.mq5`));
  const logName = `${stem}.compile.log`;
  const run = await exec(
    join(config.wineApp, 'bin', 'wine'),
    ['MetaEditor64.exe', '/portable', `/compile:MQL5\\Experts\\${EXPERT_SUBDIR}\\${stem}.mq5`, `/log:${logName}`],
    { cwd: config.mt5Dir, env: wineEnv(config), timeoutMs: COMPILE_TIMEOUT_MS },
  );
  const logPath = join(config.mt5Dir, logName);
  if (!existsSync(logPath)) {
    return { ok: false, errors: null, warnings: null, message: `MetaEditor không tạo log (mã thoát ${run.code ?? '?'}). ${run.stderr.slice(-300)}` };
  }
  const text = decodeText(readFileSync(logPath));
  rmSync(logPath, { force: true });
  const match = COMPILE_RESULT.exec(text);
  if (!match) return { ok: false, errors: null, warnings: null, message: `Log biên dịch không có dòng Result:\n${text.slice(-600)}` };
  const errors = Number(match[1]);
  const warnings = Number(match[2]);
  const detail = text
    .split('\n')
    .filter((line) => /\b(error|warning)\b/i.test(line) && !/information:/.test(line))
    .slice(0, 20)
    .join('\n');
  return { ok: errors === 0 && warnings === 0, errors, warnings, message: `${match[0]}${detail ? `\n${detail}` : ''}` };
}

/**
 * Đọc kế hoạch chạy thử `brain/test-plan.json` của project; lỗi cú pháp/ cấu trúc trả mảng lỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function loadPlan(projectDir: string, maxRuns: number): { plan: TestPlan | null; errors: string[] } {
  const path = join(projectDir, PLAN_FILE);
  if (!existsSync(path)) return { plan: null, errors: [`Thiếu ${PLAN_FILE} (Ban Thiết kế phải lập kế hoạch chạy thử)`] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { plan: null, errors: [`${PLAN_FILE} không phải JSON hợp lệ: ${String(error)}`] };
  }
  const errors = validatePlan(parsed, maxRuns);
  return { plan: errors.length === 0 ? (parsed as TestPlan) : null, errors };
}

/**
 * Ban Dựng bàn thử: kiểm kế hoạch, giải mã đủ mọi input của EA và ghi `results/<id>.ini` cho từng lần chạy
 * (chưa chạy tester). Lỗi nào cũng dừng, không ghi file dở dang.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function prepareRuns(projectDir: string, projectId: string, config: EaConfig): PlanOutcome {
  const { plan, errors } = loadPlan(projectDir, config.maxTesterRunsPerRound);
  if (!plan) return { ok: false, summary: errors, results: [] };
  const source = join(projectDir, 'ea', `${plan.expert}.mq5`);
  if (!existsSync(source)) return { ok: false, summary: [`Không có ea/${plan.expert}.mq5`], results: [] };
  const clashes = plan.runs.filter((run) => existsSync(join(projectDir, RESULTS_DIR, `${run.id}.json`))).map((run) => run.id);
  if (clashes.length > 0) return { ok: false, summary: [`Đã có kết quả cho id: ${clashes.join(', ')} — đặt id mới cho lần chạy mới`], results: [] };
  const stem = expertStem(projectId, `${plan.expert}.mq5`);
  const sourceText = readFileSync(source, 'utf8');
  const files: Array<[string, string]> = [];
  try {
    for (const run of plan.runs) {
      const inputs = resolveInputs(sourceText, run.inputs);
      files.push([`${run.id}.ini`, buildTesterIni(expertName(stem), { ...run, id: `${stem}__${run.id}` }, inputs)]);
    }
  } catch (error) {
    return { ok: false, summary: [String(error instanceof Error ? error.message : error)], results: [] };
  }
  mkdirSync(join(projectDir, RESULTS_DIR), { recursive: true });
  for (const [name, content] of files) writeFileSync(join(projectDir, RESULTS_DIR, name), content);
  return { ok: true, summary: [`Đã dựng ${files.length} file ini (vốn 1000, real ticks): ${plan.runs.map((run) => run.id).join(', ')}`], results: [] };
}

/**
 * Xóa log agent của tester sau khi đã đọc (log có thể lên hàng GB). Chỉ đụng `Tester/Agent-*\/logs` trong bản portable.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function purgeAgentLogs(mt5Dir: string): number {
  const testerDir = join(mt5Dir, 'Tester');
  if (!existsSync(testerDir)) return 0;
  let removed = 0;
  for (const agent of readdirSync(testerDir).filter((name) => name.startsWith('Agent-'))) {
    const logsDir = join(testerDir, agent, 'logs');
    if (!existsSync(logsDir)) continue;
    for (const file of readdirSync(logsDir).filter((name) => name.endsWith('.log'))) {
      rmSync(join(logsDir, file), { force: true });
      removed += 1;
    }
  }
  return removed;
}

/**
 * Log agent mới nhất (theo thời gian sửa) của tester; không có thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function newestAgentLog(mt5Dir: string): string | null {
  const testerDir = join(mt5Dir, 'Tester');
  if (!existsSync(testerDir)) return null;
  const files = readdirSync(testerDir)
    .filter((name) => name.startsWith('Agent-'))
    .flatMap((agent) => {
      const logsDir = join(testerDir, agent, 'logs');
      return existsSync(logsDir) ? readdirSync(logsDir).filter((name) => name.endsWith('.log')).map((name) => join(logsDir, name)) : [];
    });
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

/**
 * Ban Thử nghiệm: chạy lần lượt từng lần trong kế hoạch trên bản portable (vốn 1000, real ticks), kiểm
 * header input trong log, đọc report, ghi `results/<id>.json` + `.ini`, dọn log agent. Đã dùng id nào thì
 * không chạy lại; compile phải được làm trước (EA biên dịch lại từ nguồn ngay trước khi chạy).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export async function runPlan(
  projectDir: string,
  projectId: string,
  config: EaConfig,
  exec: Exec = runExec,
  now: () => Date = () => new Date(),
): Promise<PlanOutcome> {
  const prepared = prepareRuns(projectDir, projectId, config);
  if (!prepared.ok) return prepared;
  const { plan } = loadPlan(projectDir, config.maxTesterRunsPerRound);
  if (!plan) return prepared;
  const compiled = await compileExpert(projectDir, projectId, `ea/${plan.expert}.mq5`, config, exec);
  if (!compiled.ok) return { ok: false, summary: [`Biên dịch lại trước khi chạy thất bại:\n${compiled.message}`], results: [] };
  const stem = expertStem(projectId, `${plan.expert}.mq5`);
  const sourceText = readFileSync(join(projectDir, 'ea', `${plan.expert}.mq5`), 'utf8');
  const results: TesterResult[] = [];
  const summary: string[] = [];
  for (const run of plan.runs) {
    const key = `${stem}__${run.id}`;
    const inputs = resolveInputs(sourceText, run.inputs);
    mkdirSync(join(config.mt5Dir, 'config'), { recursive: true });
    writeFileSync(join(config.mt5Dir, 'config', `${key}.ini`), buildTesterIni(expertName(stem), { ...run, id: key }, inputs));
    rmSync(join(config.mt5Dir, 'res', `${key}.htm`), { force: true });
    log.info({ projectId, run: run.id }, '[EaRunner] chạy tester');
    const exit = await exec(join(config.wineApp, 'bin', 'wine'), ['terminal64.exe', '/portable', `/config:config\\${key}.ini`], {
      cwd: config.mt5Dir,
      env: wineEnv(config),
      timeoutMs: config.testerTimeoutMinutes * MS_PER_MINUTE,
    });
    const reportPath = join(config.mt5Dir, 'res', `${key}.htm`);
    if (!existsSync(reportPath)) {
      summary.push(`${run.id}: KHÔNG có report (mã thoát ${exit.code ?? '?'}). ${exit.stderr.slice(-200)}`);
      purgeAgentLogs(config.mt5Dir);
      return { ok: false, summary, results };
    }
    const metrics = parseReportMetrics(decodeText(readFileSync(reportPath)));
    const logPath = newestAgentLog(config.mt5Dir);
    const actual = logPath ? parseLogInputs(decodeText(readTail(logPath)), expertName(stem)) : null;
    const result = buildResult(plan.expert, run, metrics, inputMismatches(inputs, actual), now().toISOString());
    mkdirSync(join(projectDir, RESULTS_DIR), { recursive: true });
    writeFileSync(join(projectDir, RESULTS_DIR, `${run.id}.json`), `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(join(projectDir, RESULTS_DIR, `${run.id}.ini`), readFileSync(join(config.mt5Dir, 'config', `${key}.ini`)));
    results.push(result);
    summary.push(describeResult(result));
    purgeAgentLogs(config.mt5Dir);
  }
  return { ok: results.every((result) => result.valid), summary, results };
}

/**
 * Một dòng tóm tắt cho báo cáo: id, hợp lệ hay không, lợi nhuận, PF, số lệnh, DD, cháy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function describeResult(result: TesterResult): string {
  const { metrics } = result;
  const state = result.valid ? 'hợp lệ' : `KHÔNG HỢP LỆ (${result.invalidReasons.join('; ')})`;
  const blown = result.blown ? ' · CHÁY TÀI KHOẢN' : '';
  return `${result.runId}: ${state} · lãi ròng ${metrics.netProfit ?? '?'} · PF ${metrics.profitFactor ?? '?'} · ${metrics.totalTrades ?? '?'} lệnh · DD vốn ${metrics.maxEquityDrawdownPercent ?? '?'}% · trễ ${result.condition.delay}${blown}`;
}
