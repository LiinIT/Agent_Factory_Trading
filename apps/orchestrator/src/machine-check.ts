import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type BasePart, resolvePartDir } from './bases.ts';
import { log } from './logger.ts';

const STEP_TIMEOUT_MS = 10 * 60_000;
const OUTPUT_TAIL = 2500;
const MAX_BUFFER = 20 * 1024 * 1024;

export type CheckStep = { name: string; ok: boolean; output: string };

export type MachineCheckResult = {
  ok: boolean;
  skipped: boolean;
  steps: CheckStep[];
  durationMs: number;
};

export type RunCommand = (command: string[], cwd: string) => Promise<{ ok: boolean; output: string }>;

/**
 * Chạy một lệnh (không qua shell) trong [cwd], gom stdout+stderr, giới hạn thời gian.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export const runCommand: RunCommand = (command, cwd) =>
  new Promise((resolvePromise) => {
    const [file, ...args] = command;
    if (!file) return resolvePromise({ ok: false, output: 'Lệnh rỗng' });
    execFile(file, args, { cwd, timeout: STEP_TIMEOUT_MS, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
      resolvePromise({ ok: !error, output: `${stdout}${stderr}`.slice(-OUTPUT_TAIL) });
    });
  });

export type CheckPlan = {
  steps: string[];
  stopOnFail: boolean;
  simulator: string | null;
};

export const QUICK_CHECK: CheckPlan = { steps: ['setup', 'codegen', 'analyze', 'test_quick'], stopOnFail: true, simulator: null };
export const FULL_CHECK: CheckPlan = { steps: ['setup', 'codegen', 'analyze', 'test'], stopOnFail: true, simulator: null };
export const ACCEPTANCE_CHECK: CheckPlan = {
  steps: ['setup', 'codegen', 'format_check', 'analyze', 'test', 'build', 'store_check', 'integration'],
  stopOnFail: false,
  simulator: null,
};

const SIMULATOR_PLACEHOLDER = '{ios_simulator}';

type LocatedPart = { part: BasePart; cwd: string; marker: string };

/**
 * Lệnh của một bước: `test_quick` thiếu thì dùng `test`; bước có `requires` chỉ chạy khi file
 * nhận diện chứa chuỗi đó; integration cần máy ảo (thay `{ios_simulator}`), không có thì bỏ qua.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function commandFor(step: string, located: LocatedPart, simulator: string | null): string[] | undefined {
  const required = located.part.requires?.[step];
  if (required && !located.marker.includes(required)) return undefined;
  const { commands } = located.part;
  const command = step === 'test_quick' ? (commands.test_quick ?? commands.test) : commands[step];
  if (!command) return undefined;
  if (!command.includes(SIMULATOR_PLACEHOLDER)) return command;
  return simulator ? command.map((part) => (part === SIMULATOR_PLACEHOLDER ? simulator : part)) : undefined;
}

/**
 * Tìm thư mục của phần trong project (mẫu `*_app`… rồi `fallbackDirs`); không thấy file nhận diện thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function locatePart(projectDir: string, part: BasePart): LocatedPart | null {
  const dir = resolvePartDir(projectDir, part);
  if (dir === null) return null;
  return { part, cwd: join(projectDir, dir), marker: readFileSync(join(projectDir, dir, part.marker), 'utf8') };
}

/**
 * Máy tự kiểm theo [plan] (mặc định rút gọn cho Ban Kiểm soát chế độ Tà môn), lần lượt từng phần
 * có trong project, mỗi phần chạy trong thư mục của nó; bước ghi `<phần>:<bước>`.
 * `stopOnFail` = false thì chạy hết để gom mọi lỗi một lượt (dùng cho nghiệm thu).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export async function runMachineCheck(
  projectDir: string,
  parts: BasePart[],
  run: RunCommand = runCommand,
  plan: CheckPlan = QUICK_CHECK,
): Promise<MachineCheckResult> {
  const startedAt = Date.now();
  const located = parts.map((part) => locatePart(projectDir, part)).filter((item) => item !== null);
  if (located.length === 0) return { ok: false, skipped: true, steps: [], durationMs: 0 };
  const steps: CheckStep[] = [];
  for (const item of located) {
    for (const step of plan.steps) {
      const command = commandFor(step, item, plan.simulator);
      if (!command) continue;
      const result = await run(command, item.cwd);
      const name = item.part.name ? `${item.part.name}:${step}` : step;
      steps.push({ name, ok: result.ok, output: result.output });
      log.info({ projectDir, step: name, ok: result.ok }, '[MachineCheck] bước');
      if (!result.ok && plan.stopOnFail) return finish(steps, startedAt);
    }
  }
  return finish(steps, startedAt);
}

/**
 * Gói kết quả: ĐẠT khi có ít nhất một bước và mọi bước đều đạt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function finish(steps: CheckStep[], startedAt: number): MachineCheckResult {
  return { ok: steps.length > 0 && steps.every((step) => step.ok), skipped: false, steps, durationMs: Date.now() - startedAt };
}

/**
 * Tóm tắt kết quả máy kiểm soát: dòng bằng chứng khi ĐẠT, hoặc log bước lỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function describeMachineCheck(result: MachineCheckResult): string {
  if (result.skipped) return 'Máy chưa kiểm soát được: project chưa có phần nào để kiểm (<tên>_app/pubspec.yaml, <tên>_server/pubspec.yaml, <tên>_web/package.json).';
  const passed = result.steps.filter((step) => step.ok).map((step) => step.name);
  const failed = result.steps.filter((step) => !step.ok);
  if (failed.length === 0) return `Máy kiểm ĐẠT: ${passed.join(' → ')}.`;
  const details = failed.map((step) => `### Bước "${step.name}" KHÔNG ĐẠT\n${step.output}`).join('\n\n');
  return `Máy kiểm KHÔNG ĐẠT ${failed.length} bước (đã qua: ${passed.join(', ') || 'không'}):\n${details}`;
}
