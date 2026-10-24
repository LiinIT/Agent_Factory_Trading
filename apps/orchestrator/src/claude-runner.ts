import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';

import { log } from './logger.ts';
import { isUsageLimitText } from './quota.ts';
import { parseStreamLine } from './stream-parser.ts';
import type { QuotaSnapshot, RunClaude, RunRequest, RunResult, RunUsage } from './types.ts';

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';
const FALLBACK_MODEL = 'sonnet';
const KILL_GRACE_MS = 10_000;
const STDERR_TAIL = 2000;
const ALWAYS_ON_TOOLS = ['Skill'];
const EMPTY_USAGE: RunUsage = { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 };

const runningChildren = new Set<ChildProcess>();

/**
 * Dựng tham số dòng lệnh cho `claude -p`: stream-json, chỉ những tool được phép,
 * tự từ chối mọi quyền ngoài danh sách (dontAsk), bỏ qua settings cấp user, và không
 * nạp MCP/connector nào (Notion, Drive… của tài khoản) — vừa an toàn vừa đỡ hàng chục nghìn token.
 * Chỉ vai có công cụ trình duyệt mới bật `--chrome` (Claude in Chrome).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function buildClaudeArgs(request: RunRequest): string[] {
  const toolNames = [
    ...new Set([...request.allowedTools.map((tool) => tool.replace(/\(.*$/, '')), ...ALWAYS_ON_TOOLS]),
  ];
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', request.model,
    '--permission-mode', 'dontAsk',
    '--setting-sources', 'project',
    '--strict-mcp-config',
    '--exclude-dynamic-system-prompt-sections',
    '--append-system-prompt', request.systemPrompt,
    '--tools', toolNames.join(','),
  ];
  if (request.allowedTools.length > 0) {
    args.push('--allowedTools', [...request.allowedTools, ...ALWAYS_ON_TOOLS].join(','));
  }
  if (request.model !== FALLBACK_MODEL) args.push('--fallback-model', FALLBACK_MODEL);
  if (request.jsonSchema) args.push('--json-schema', JSON.stringify(request.jsonSchema));
  if (request.effort) args.push('--effort', request.effort);
  if (request.browser) args.push('--chrome');
  if (request.resumeSessionId) args.push('--resume', request.resumeSessionId);
  return args;
}

/**
 * Chạy một phiên `claude -p` (prompt qua stdin), đọc luồng sự kiện, dừng khi quá giờ.
 * Gỡ khoá Claude khỏi môi trường thừa hưởng (mặc định dùng gói đăng ký đang đăng nhập);
 * chỉ nạp khoá khi nguồn được chọn yêu cầu (`request.env`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export const runClaude: RunClaude = (request) =>
  new Promise<RunResult>((resolvePromise) => {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.CLAUDE_CODE_OAUTH_TOKEN;
    Object.assign(env, request.env);
    const child = spawn(CLAUDE_BIN, buildClaudeArgs(request), {
      cwd: request.cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    runningChildren.add(child);
    log.info({ cwd: request.cwd, model: request.model }, '[ClaudeRunner] start');

    let sessionId: string | null = request.resumeSessionId ?? null;
    let model: string | null = null;
    let aborted = false;
    const startedAt = Date.now();
    let quota: QuotaSnapshot | null = null;
    let finalResult: RunResult | null = null;
    let stderrTail = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      log.warn({ cwd: request.cwd }, '[ClaudeRunner] quá giờ, dừng tiến trình');
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref();
    }, request.timeoutMs);
    const onAbort = () => {
      aborted = true;
      log.warn({ cwd: request.cwd }, '[ClaudeRunner] bị dừng theo lệnh');
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref();
    };
    request.signal?.addEventListener('abort', onAbort, { once: true });

    createInterface({ input: child.stdout }).on('line', (line) => {
      for (const event of parseStreamLine(line)) {
        if (event.kind === 'session') {
          sessionId = event.sessionId;
          model = event.model ?? model;
        }
        if (event.kind === 'quota') quota = event.quota;
        if (event.kind === 'result') {
          finalResult = {
            ok: !event.isError,
            text: event.text,
            structured: event.structured,
            sessionId,
            model,
            isUsageLimit: event.isError && isUsageLimitText(event.text),
            quota,
            costUsd: event.costUsd,
            permissionDenials: event.denials,
            usage: event.usage,
            durationMs: event.durationMs,
          };
        }
        request.onEvent?.(event);
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-STDERR_TAIL);
    });

    child.on('error', (error) => {
      log.error({ err: error }, '[ClaudeRunner] không chạy được claude');
      stderrTail = `${stderrTail}\n${error.message}`;
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      request.signal?.removeEventListener('abort', onAbort);
      runningChildren.delete(child);
      const result: RunResult = finalResult ?? {
        ok: false,
        text: failureText(timedOut, aborted ? (request.signal?.reason ?? 'Bị dừng theo lệnh') : null, request.timeoutMs, code, stderrTail),
        structured: null,
        sessionId,
        isUsageLimit: isUsageLimitText(stderrTail),
        quota,
        costUsd: 0,
        model,
        permissionDenials: [],
        usage: EMPTY_USAGE,
        durationMs: Date.now() - startedAt,
      };
      log.info({ ok: result.ok, code, usageLimit: result.isUsageLimit }, '[ClaudeRunner] end');
      resolvePromise({ ...result, quota: result.quota ?? quota });
    });

    child.stdin.end(request.prompt);
  });

/**
 * Lý do thất bại khi claude không trả kết quả cuối.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function failureText(timedOut: boolean, abortReason: unknown, timeoutMs: number, code: number | null, stderrTail: string): string {
  if (abortReason !== null) return String(abortReason);
  if (timedOut) return `Quá thời gian ${Math.round(timeoutMs / 60_000)} phút`;
  return `claude thoát mã ${code}: ${stderrTail.trim()}`;
}

/**
 * Dừng mọi tiến trình claude đang chạy (khi tắt server).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function killAllClaude(): void {
  for (const child of runningChildren) child.kill('SIGTERM');
}
