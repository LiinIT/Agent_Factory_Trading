import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

import { log } from './logger.ts';
import { isUsageLimitText } from './quota.ts';
import type { RunRequest, RunResult, RunUsage, StreamEvent } from './types.ts';

const CODEX_BIN = process.env.CODEX_BIN ?? 'codex';
const KILL_GRACE_MS = 10_000;
const STDERR_TAIL = 2000;
const MAX_TOOL_SUMMARY = 160;
const EMPTY_USAGE: RunUsage = { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 };

type CodexEvent = Record<string, unknown>;

/**
 * Đổi một dòng `codex exec --json` thành sự kiện chung của hệ thống.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseCodexLine(line: string): StreamEvent[] {
  let event: CodexEvent;
  try {
    event = JSON.parse(line.trim());
  } catch {
    return [];
  }
  if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
    return [{ kind: 'session', sessionId: event.thread_id, model: null }];
  }
  if (event.type !== 'item.completed') return [];
  const item = (event.item ?? {}) as Record<string, unknown>;
  if (item.type === 'agent_message' && typeof item.text === 'string') return [{ kind: 'text', text: item.text }];
  if (item.type === 'command_execution' && typeof item.command === 'string') {
    return [{ kind: 'tool', text: `Bash: ${item.command}`.slice(0, MAX_TOOL_SUMMARY) }];
  }
  if (item.type === 'file_change') return [{ kind: 'tool', text: 'Edit: thay đổi file' }];
  return [];
}

/**
 * Đọc token từ `turn.completed.usage` của Codex.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseCodexUsage(usage: unknown): RunUsage {
  const data = (usage ?? {}) as Record<string, unknown>;
  const number = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : 0);
  return {
    inputTokens: number('input_tokens') - number('cached_input_tokens'),
    cacheCreationTokens: number('cache_write_input_tokens'),
    cacheReadTokens: number('cached_input_tokens'),
    outputTokens: number('output_tokens') + number('reasoning_output_tokens'),
  };
}

/**
 * Tham số `codex exec`: JSON, sandbox ghi trong thư mục project (không mạng), schema báo cáo.
 * System prompt của ban được ghép vào đầu prompt vì Codex không có cờ system prompt riêng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function buildCodexArgs(request: RunRequest, schemaPath: string | null): string[] {
  const args = request.resumeSessionId ? ['exec', 'resume', request.resumeSessionId] : ['exec'];
  args.push('--json', '--skip-git-repo-check', '--sandbox', request.allowedTools.some((tool) => /^(Write|Edit|Bash)/.test(tool)) ? 'workspace-write' : 'read-only');
  args.push('-C', request.cwd);
  if (request.model) args.push('-m', request.model);
  if (schemaPath) args.push('--output-schema', schemaPath);
  args.push('-');
  return args;
}

/**
 * Chạy một phiên Codex (ChatGPT Plus đăng nhập sẵn, hoặc OPENAI_API_KEY qua env), cùng
 * hợp đồng với runClaude để Ban Thông tin dùng thay thế được.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function runCodex(request: RunRequest): Promise<RunResult> {
  return new Promise((resolvePromise) => {
    const schemaDir = request.jsonSchema ? mkdtempSync(join(tmpdir(), 'codex-schema-')) : null;
    const schemaPath = schemaDir ? join(schemaDir, 'schema.json') : null;
    if (schemaPath) writeFileSync(schemaPath, JSON.stringify(request.jsonSchema));
    const child = spawn(CODEX_BIN, buildCodexArgs(request, schemaPath), {
      cwd: request.cwd,
      env: { ...process.env, ...request.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const startedAt = Date.now();
    let sessionId = request.resumeSessionId ?? null;
    let lastMessage = '';
    let usage = EMPTY_USAGE;
    let failure: string | null = null;
    let stderrTail = '';
    const stop = () => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref();
    };
    const timer = setTimeout(() => {
      failure = `Quá thời gian ${Math.round(request.timeoutMs / 60_000)} phút`;
      stop();
    }, request.timeoutMs);
    const onAbort = () => {
      failure = String(request.signal?.reason ?? 'Bị dừng theo lệnh');
      stop();
    };
    request.signal?.addEventListener('abort', onAbort, { once: true });
    log.info({ cwd: request.cwd, model: request.model }, '[CodexRunner] start');

    createInterface({ input: child.stdout }).on('line', (line) => {
      for (const event of parseCodexLine(line)) {
        if (event.kind === 'session') sessionId = event.sessionId;
        if (event.kind === 'text') lastMessage = event.text;
        request.onEvent?.(event);
      }
      const raw = line.trim();
      if (raw.includes('"turn.completed"')) usage = parseCodexUsage(JSON.parse(raw).usage);
      if (raw.includes('"turn.failed"') || raw.includes('"type":"error"')) failure = raw.slice(0, STDERR_TAIL);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-STDERR_TAIL);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      request.signal?.removeEventListener('abort', onAbort);
      if (schemaDir) rmSync(schemaDir, { recursive: true, force: true });
      const errorText = failure ?? (code === 0 ? null : `codex thoát mã ${code}: ${stderrTail.trim()}`);
      let structured: unknown = null;
      try {
        structured = request.jsonSchema && lastMessage ? JSON.parse(lastMessage) : null;
      } catch {
        structured = null;
      }
      log.info({ ok: !errorText, code }, '[CodexRunner] end');
      resolvePromise({
        ok: !errorText,
        text: errorText ?? lastMessage,
        structured,
        sessionId,
        model: request.model || 'codex',
        isUsageLimit: !!errorText && isUsageLimitText(errorText),
        quota: null,
        costUsd: 0,
        permissionDenials: [],
        usage,
        durationMs: Date.now() - startedAt,
      });
    });
    child.stdin.end(`${request.systemPrompt}\n\n---\n\n${request.prompt}`);
  });
}
