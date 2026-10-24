import { quotaFromRateLimitInfo } from './quota.ts';
import type { RunUsage, StreamEvent } from './types.ts';

const MAX_TOOL_SUMMARY = 160;

/**
 * Đổi một dòng `--output-format stream-json` của Claude Code thành các sự kiện
 * hệ thống cần (session, lời nói, tool đã gọi, quota, kết quả cuối).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function parseStreamLine(line: string, now: number = Date.now()): StreamEvent[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return [];
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(trimmed);
  } catch {
    return [];
  }
  switch (message.type) {
    case 'system':
      return message.subtype === 'init' && typeof message.session_id === 'string'
        ? [{ kind: 'session', sessionId: message.session_id, model: typeof message.model === 'string' ? message.model : null }]
        : [];
    case 'assistant':
      return parseAssistant(message.message);
    case 'rate_limit_event': {
      const quota = quotaFromRateLimitInfo(message.rate_limit_info, now);
      return quota ? [{ kind: 'quota', quota }] : [];
    }
    case 'result':
      return [
        {
          kind: 'result',
          isError: message.is_error === true || message.subtype !== 'success',
          text: typeof message.result === 'string' ? message.result : '',
          structured: message.structured_output ?? null,
          costUsd: typeof message.total_cost_usd === 'number' ? message.total_cost_usd : 0,
          denials: suggestPermissions(message.permission_denials),
          usage: parseUsage(message.usage),
          durationMs: typeof message.duration_ms === 'number' ? message.duration_ms : 0,
        },
      ];
    default:
      return [];
  }
}

/**
 * Tách lời nói và lệnh tool trong một tin `assistant`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function parseAssistant(body: unknown): StreamEvent[] {
  const content = (body as { content?: unknown } | null)?.content;
  if (!Array.isArray(content)) return [];
  const events: StreamEvent[] = [];
  for (const block of content as Record<string, unknown>[]) {
    if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
      events.push({ kind: 'text', text: block.text.trim() });
    } else if (block.type === 'tool_use' && block.name !== 'StructuredOutput') {
      events.push({ kind: 'tool', text: summarizeTool(String(block.name), block.input) });
    }
  }
  return events;
}

/**
 * Đọc `usage` của kết quả cuối (token vào/ra, cache tạo/đọc).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function parseUsage(usage: unknown): RunUsage {
  const data = (usage ?? {}) as Record<string, unknown>;
  const number = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : 0);
  return {
    inputTokens: number('input_tokens'),
    cacheCreationTokens: number('cache_creation_input_tokens'),
    cacheReadTokens: number('cache_read_input_tokens'),
    outputTokens: number('output_tokens'),
  };
}

/**
 * Đổi `permission_denials` thành mẫu quyền gợi ý để chủ nhân cấp, vd lệnh
 * `curl -s https://x` → `Bash(curl *)`; tool khác → tên tool.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function suggestPermissions(denials: unknown): string[] {
  if (!Array.isArray(denials)) return [];
  const suggestions = denials.map((denial) => {
    const { tool_name: toolName, tool_input: toolInput } = (denial ?? {}) as Record<string, unknown>;
    const command = (toolInput as { command?: unknown } | undefined)?.command;
    if (toolName === 'Bash' && typeof command === 'string') {
      const program = command.trim().split(/\s+/)[0];
      return program ? `Bash(${program} *)` : 'Bash';
    }
    return typeof toolName === 'string' ? toolName : '';
  });
  return [...new Set(suggestions.filter(Boolean))];
}

/**
 * Một dòng mô tả lần gọi tool: tên + lệnh hoặc file chính.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function summarizeTool(name: string, input: unknown): string {
  const fields = (input ?? {}) as Record<string, unknown>;
  const target = fields.command ?? fields.file_path ?? fields.pattern ?? fields.query ?? fields.skill ?? fields.url ?? fields.action ?? '';
  const summary = `${name}${target ? `: ${String(target)}` : ''}`;
  return summary.length > MAX_TOOL_SUMMARY ? `${summary.slice(0, MAX_TOOL_SUMMARY)}…` : summary;
}
