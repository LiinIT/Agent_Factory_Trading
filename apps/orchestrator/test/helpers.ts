import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FactoryBus } from '../src/bus.ts';
import { Logistics } from '../src/logistics.ts';
import { ModeState, type ModeProfile } from '../src/mode.ts';
import { QuotaState } from '../src/quota-state.ts';
import { FactoryStore } from '../src/store.ts';
import type { RoleDefinition, RunClaude, RunRequest, RunResult } from '../src/types.ts';
import { Workspace } from '../src/workspace.ts';

export const TA_MON: ModeProfile = {
  models: { 'kiem-soat': 'haiku' },
  effort: { 'kiem-soat': 'low' },
  machineCheck: true,
  notes: { '*': 'TÀ MÔN', 'kiem-soat': 'đọc lỗi máy' },
};

export const THRESHOLDS = {
  pauseAtFiveHourUtilization: 0.9,
  pauseAtSevenDayUtilization: 0.97,
  fallbackPauseMinutes: 60,
  alarmFiveHourDeltaPerTask: 0.1,
};

/**
 * Một vai giả cho test.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function role(name: string, gate = false): RoleDefinition {
  return {
    name,
    title: name.toUpperCase(),
    unit: `Ban ${name}`,
    block: 'Khối test',
    duty: `nhiệm vụ ${name}`,
    skills: [],
    model: 'sonnet',
    gate,
    timeoutMinutes: 1,
    allowedTools: ['Read'],
    prompt: `vai ${name}`,
  };
}

/**
 * Biên chế giả: tham-muu-truong, tac-chien (có cổng), xung-kich, kiem-soat.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function fakeTeam(): Map<string, RoleDefinition> {
  return new Map(
    [role('tham-muu-truong'), role('tac-chien', true), role('xung-kich'), role('kiem-soat'), role('nghiem-thu', true)].map((item) => [item.name, item]),
  );
}

/**
 * Kết quả chạy claude thành công.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function okResult(text: string, structured: unknown = null): RunResult {
  return {
    ok: true,
    text,
    structured,
    sessionId: 'session-1',
    model: 'claude-sonnet-5-5',
    isUsageLimit: false,
    quota: null,
    costUsd: 0.25,
    permissionDenials: [],
    usage: { inputTokens: 10, cacheCreationTokens: 1000, cacheReadTokens: 5000, outputTokens: 200 },
    durationMs: 4000,
  };
}

/**
 * Báo cáo JSON giả của một ban.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function report(result: 'ĐẠT' | 'KHÔNG ĐẠT' | 'CẦN HỎI', extra: Record<string, unknown> = {}) {
  return { mission: 'nhiệm vụ', result, evidence: '3/3 test pass', obstacles: 'Không', questions: [], proposal: 'tiếp', howToRun: 'Không', ...extra };
}

/**
 * Runner giả: trả lần lượt các kết quả cho trước, ghi lại mọi request.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function scriptedRunner(results: RunResult[]): { run: RunClaude; requests: RunRequest[] } {
  const requests: RunRequest[] = [];
  const run: RunClaude = async (request) => {
    requests.push(request);
    const next = results.shift();
    if (!next) throw new Error('Runner giả hết kết quả');
    return next;
  };
  return { run, requests };
}

/**
 * Môi trường test: DB trong RAM, workspace + template + skill trong thư mục tạm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function testEnvironment() {
  const root = mkdtempSync(join(tmpdir(), 'factory-test-'));
  const templateDir = join(root, 'template');
  const skillsDir = join(root, 'skills');
  mkdirSync(join(templateDir, 'brain'), { recursive: true });
  mkdirSync(join(skillsDir, 'demo'), { recursive: true });
  writeFileSync(join(templateDir, 'CLAUDE.md'), '# test\n');
  writeFileSync(join(skillsDir, 'demo/SKILL.md'), '---\nname: demo\n---\n');
  const store = new FactoryStore(':memory:');
  const quota = new QuotaState(store, THRESHOLDS);
  return {
    root,
    store,
    bus: new FactoryBus(),
    quota,
    logistics: new Logistics(store, THRESHOLDS.alarmFiveHourDeltaPerTask),
    mode: new ModeState(store, { 'ta-mon': TA_MON }),
    base: null,
    workspace: new Workspace({ workspaceDir: join(root, 'workspace'), templateDir, skillsDir, projectPath: (id) => store.getProject(id)?.dir ?? null }),
  };
}
