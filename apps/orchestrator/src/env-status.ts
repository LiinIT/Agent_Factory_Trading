import { execFile } from 'node:child_process';

const STATUS_TIMEOUT_MS = 15_000;
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';

export type LoginStatus = { ok: boolean; detail: string };

/**
 * Chạy một lệnh kiểm trạng thái, trả mã thoát và stdout.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function probe(file: string, args: string[]): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolvePromise) => {
    execFile(file, args, { timeout: STATUS_TIMEOUT_MS }, (error, stdout, stderr) => {
      resolvePromise({ ok: !error, output: `${stdout}${stderr}`.trim() });
    });
  });
}

/**
 * Trạng thái đăng nhập Claude Code (gói chính).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export async function claudeLoginStatus(): Promise<LoginStatus> {
  const result = await probe('claude', ['auth', 'status']);
  return { ok: result.ok, detail: result.ok ? 'đã đăng nhập' : 'chưa đăng nhập — chạy `claude auth login`' };
}

/**
 * Trạng thái đăng nhập Codex CLI (ChatGPT Plus).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export async function codexLoginStatus(): Promise<LoginStatus> {
  const result = await probe('codex', ['login', 'status']);
  const isChatGpt = /ChatGPT/i.test(result.output);
  return { ok: result.ok && /Logged in/i.test(result.output), detail: isChatGpt ? 'đăng nhập bằng ChatGPT' : result.output || 'chưa đăng nhập — chạy `codex login`' };
}

/**
 * Ollama có đang chạy không + các model đã tải.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export async function ollamaStatus(): Promise<LoginStatus> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
    const data = (await response.json()) as { models?: { name: string }[] };
    return { ok: true, detail: (data.models ?? []).map((model) => model.name).join(', ') || 'chưa có model' };
  } catch {
    return { ok: false, detail: 'chưa chạy — mở app Ollama hoặc `ollama serve`' };
  }
}
