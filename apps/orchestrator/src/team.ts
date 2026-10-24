import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RoleDefinition } from './types.ts';

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const DEFAULT_TIMEOUT_MINUTES = 30;

/**
 * Đọc một file vai trong `team/` (frontmatter `key: value` + thân là system prompt).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function parseRoleFile(content: string): RoleDefinition {
  const match = FRONTMATTER.exec(content.replace(/\r\n/g, '\n'));
  if (!match) throw new Error('Thiếu frontmatter --- ... ---');
  const fields = new Map<string, string>();
  for (const line of (match[1] ?? '').split('\n')) {
    const separator = line.indexOf(':');
    if (separator > 0) {
      fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
    }
  }
  const name = fields.get('name');
  const model = fields.get('model');
  if (!name || !model) throw new Error('Vai cần có name và model');
  return {
    name,
    title: fields.get('title') ?? name,
    unit: fields.get('unit') ?? fields.get('title') ?? name,
    block: fields.get('block') ?? '',
    duty: fields.get('duty') ?? '',
    skills: splitList(fields.get('skills')),
    model,
    gate: fields.get('gate') === 'true',
    timeoutMinutes: Number(fields.get('timeoutMinutes') ?? DEFAULT_TIMEOUT_MINUTES),
    allowedTools: splitList(fields.get('allowedTools')),
    writes: splitList(fields.get('writes')),
    prompt: (match[2] ?? '').trim(),
  };
}

/**
 * Nạp toàn bộ vai trong thư mục `team/`, khoá theo `name`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function loadTeam(teamDir: string): Map<string, RoleDefinition> {
  const team = new Map<string, RoleDefinition>();
  for (const file of readdirSync(teamDir).filter((name) => name.endsWith('.md'))) {
    const role = parseRoleFile(readFileSync(join(teamDir, file), 'utf8'));
    team.set(role.name, role);
  }
  return team;
}

/**
 * Tách danh sách "a, b, c" thành mảng, bỏ phần rỗng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
