import { log } from './logger.ts';
import type { QuotaState } from './quota-state.ts';
import type { SecretStore } from './secrets.ts';
import type { FactoryStore } from './store.ts';
import type { RunClaude, RunRequest, RunResult, RunUsage } from './types.ts';

export type Engine = 'claude' | 'codex';

export type ProviderDefinition = {
  id: string;
  label: string;
  engine: Engine;
  billing: 'goi' | 'token';
  secretName?: string;
  envNames?: string[];
  models: string[];
  note: string;
};

export type Assignment = { provider: string; model?: string };

const CLAUDE_MAIN: ProviderDefinition = {
  id: 'claude-main',
  label: 'Claude · gói chính',
  engine: 'claude',
  billing: 'goi',
  models: ['haiku', 'sonnet', 'opus'],
  note: 'Tài khoản đang đăng nhập Claude Code',
};

export const PROVIDERS: ProviderDefinition[] = [
  CLAUDE_MAIN,
  {
    id: 'claude-alt',
    label: 'Claude · tài khoản phụ',
    engine: 'claude',
    billing: 'goi',
    secretName: 'CLAUDE_CODE_OAUTH_TOKEN',
    envNames: ['CLAUDE_CODE_OAUTH_TOKEN'],
    models: ['haiku', 'sonnet', 'opus'],
    note: 'Token từ `claude setup-token` của tài khoản khác',
  },
  {
    id: 'claude-api',
    label: 'Claude API',
    engine: 'claude',
    billing: 'token',
    secretName: 'ANTHROPIC_API_KEY',
    envNames: ['ANTHROPIC_API_KEY'],
    models: ['haiku', 'sonnet', 'opus'],
    note: 'Trả tiền theo token (console.anthropic.com)',
  },
  { id: 'chatgpt-plus', label: 'ChatGPT Plus · Codex', engine: 'codex', billing: 'goi', models: [], note: 'Codex CLI đăng nhập bằng ChatGPT — không cần khoá' },
  {
    id: 'openai-api',
    label: 'OpenAI API · Codex',
    engine: 'codex',
    billing: 'token',
    secretName: 'OPENAI_API_KEY',
    envNames: ['OPENAI_API_KEY', 'CODEX_API_KEY'],
    models: [],
    note: 'Trả tiền theo token (platform.openai.com)',
  },
];

export const DEFAULT_PROVIDER = CLAUDE_MAIN.id;
const CLAUDE_ONLY_ROLES = new Set(['tham-muu-truong']);
const ASSIGN_KEY = 'provider_assignments';
const FALLBACK_KEY = 'provider_fallback';
const PREFERRED_KEY = 'preferred_claude';
const CAP_KEY = 'spend_cap_usd';
const SESSION_KEY_PREFIX = 'session_provider:';
const TOKENS_PER_MILLION = 1_000_000;
const TEST_CLAUDE_MODEL = 'haiku';
const TEST_TIMEOUT_MS = 90_000;
const TEST_OUTPUT_MAX = 300;

export type RouterDeps = {
  store: FactoryStore;
  secrets: SecretStore;
  quota: QuotaState;
  engines: Record<Engine, RunClaude>;
  defaultCapUsd: number;
  openAiPricePerMillion: { input: number; output: number };
};

/**
 * Tìm định nghĩa nguồn theo id.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function providerById(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

/**
 * Kết quả lỗi dựng sẵn (thiếu khoá, vượt trần…) — không gọi model.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function refusal(text: string, provider: string): RunResult {
  return {
    ok: false,
    text,
    structured: null,
    sessionId: null,
    model: null,
    isUsageLimit: false,
    quota: null,
    costUsd: 0,
    permissionDenials: [],
    usage: { inputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, outputTokens: 0 },
    durationMs: 0,
    provider,
  };
}

/**
 * Bộ chọn "nguồn hoả lực": mỗi ban dùng nguồn + model được gán ở màn Env; nạp khoá từ
 * Keychain vào môi trường tiến trình con; hết quota thì chuyển nguồn dự phòng; nguồn trả
 * theo token bị chặn khi vượt trần chi tiêu ngày. Tham mưu trưởng chỉ dùng Claude.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export class ProviderRouter {
  readonly deps: RouterDeps;

  /**
   * Khởi tạo với store, kho khoá và các engine chạy agent.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  constructor(deps: RouterDeps) {
    this.deps = deps;
  }

  /**
   * Bảng gán nguồn theo ban.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  assignments(): Record<string, Assignment> {
    return this.deps.store.getSetting<Record<string, Assignment>>(ASSIGN_KEY, {});
  }

  /**
   * Gán nguồn + model cho một ban (kiểm nguồn tồn tại, Tham mưu trưởng chỉ Claude).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  assign(role: string, providerId: string, model?: string): Record<string, Assignment> {
    const provider = providerById(providerId);
    if (!provider) throw new Error(`Không có nguồn ${providerId}`);
    if (CLAUDE_ONLY_ROLES.has(role) && provider.engine !== 'claude') throw new Error('Tham mưu trưởng chỉ được dùng nguồn Claude');
    const next = { ...this.assignments(), [role]: { provider: providerId, model: model?.trim() || undefined } };
    this.deps.store.setSetting(ASSIGN_KEY, next);
    log.info({ role, providerId, model }, '[Providers] gán nguồn');
    return next;
  }

  /**
   * Tài khoản Claude chạy mặc định cho các ban chưa gán nguồn riêng (gói chính hoặc tài khoản phụ).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  preferred(): string {
    return this.deps.store.getSetting<string>(PREFERRED_KEY, DEFAULT_PROVIDER);
  }

  /**
   * Đặt tài khoản Claude chạy mặc định.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  setPreferred(providerId: string): void {
    if (providerById(providerId)?.engine !== 'claude') throw new Error(`${providerId} không phải nguồn Claude`);
    this.deps.store.setSetting(PREFERRED_KEY, providerId);
  }

  /**
   * Nguồn dự phòng khi hết quota (null = không dự phòng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  fallback(): string | null {
    return this.deps.store.getSetting<string | null>(FALLBACK_KEY, null);
  }

  /**
   * Đặt nguồn dự phòng.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  setFallback(providerId: string | null): void {
    if (providerId && !providerById(providerId)) throw new Error(`Không có nguồn ${providerId}`);
    this.deps.store.setSetting(FALLBACK_KEY, providerId);
  }

  /**
   * Trần chi tiêu / ngày (USD) cho nguồn trả theo token.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  capUsd(): number {
    return this.deps.store.getSetting<number>(CAP_KEY, this.deps.defaultCapUsd);
  }

  /**
   * Đặt trần chi tiêu.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  setCap(usd: number): void {
    if (!Number.isFinite(usd) || usd < 0) throw new Error('Trần chi tiêu phải là số ≥ 0');
    this.deps.store.setSetting(CAP_KEY, usd);
  }

  /**
   * Chi tiêu hôm nay theo nguồn (OpenAI qua Codex không trả chi phí → ước tính theo token).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  spendToday(now: Date = new Date()): Record<string, number> {
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const totals: Record<string, number> = {};
    for (const run of this.deps.store.listRuns()) {
      if (!run.provider || Date.parse(run.startedAt) < midnight.getTime()) continue;
      totals[run.provider] = (totals[run.provider] ?? 0) + this.costOf(run.provider, run.costUsd, run.usage);
    }
    return totals;
  }

  /**
   * Chi phí một lần chạy: số thật của Claude, ước tính theo giá cấu hình cho OpenAI API.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private costOf(providerId: string, costUsd: number, usage: RunUsage): number {
    if (providerId !== 'openai-api') return costUsd;
    const { input, output } = this.deps.openAiPricePerMillion;
    const inputTokens = usage.inputTokens + usage.cacheCreationTokens + usage.cacheReadTokens;
    return (inputTokens * input + usage.outputTokens * output) / TOKENS_PER_MILLION;
  }

  /**
   * Chuỗi nguồn của một ban: nguồn đã gán, rồi nguồn dự phòng (nếu ban được dùng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  chain(role: string): Assignment[] {
    const assignment = this.assignments()[role] ?? { provider: this.preferred() };
    const fallbackId = this.fallback();
    const fallback = fallbackId ? providerById(fallbackId) : undefined;
    const canUseFallback = fallback && fallback.id !== assignment.provider && !(CLAUDE_ONLY_ROLES.has(role) && fallback.engine !== 'claude');
    return canUseFallback ? [assignment, { provider: fallback.id }] : [assignment];
  }

  /**
   * Mọi nguồn đang được dùng (tài khoản ưu tiên, nguồn đã gán cho các ban, nguồn dự phòng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  sourcesInUse(): string[] {
    const assigned = Object.values(this.assignments()).map((assignment) => assignment.provider);
    const fallbackId = this.fallback();
    return [...new Set([this.preferred(), ...assigned, ...(fallbackId ? [fallbackId] : [])])];
  }

  /**
   * Ban còn ít nhất một nguồn chưa nghỉ vì quota không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  canRun(role: string): boolean {
    return this.chain(role).some((assignment) => !this.deps.quota.isSourcePaused(assignment.provider));
  }

  /**
   * Chạy theo chuỗi nguồn của ban: bỏ qua nguồn đang nghỉ vì quota, nguồn nào hết quota
   * giữa chừng thì cho nghỉ và chuyển sang nguồn kế tiếp (không resume phiên cũ).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  run: RunClaude = async (request) => {
    const role = request.role ?? '';
    const chain = this.chain(role);
    const assignedId = chain[0]?.provider ?? this.preferred();
    let result: RunResult = { ...refusal('Mọi nguồn của ban đang nghỉ vì hết quota — chờ quota reset.', assignedId), isUsageLimit: true };
    let hasRun = false;
    for (const assignment of chain) {
      if (this.deps.quota.isSourcePaused(assignment.provider)) continue;
      hasRun = true;
      const isSwitched = assignment.provider !== assignedId;
      if (isSwitched) this.announceSwitch(request, role, assignedId, assignment.provider);
      result = await this.runWith(assignment, isSwitched ? { ...request, resumeSessionId: null } : request);
      if (!result.isUsageLimit) return result;
      this.deps.quota.markUsageLimit(assignment.provider);
    }
    if (!hasRun) log.warn({ role }, '[Providers] mọi nguồn của ban đang nghỉ vì quota');
    return result;
  };

  /**
   * Báo lên log và luồng sự kiện việc đổi sang nguồn khác vì quota.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private announceSwitch(request: RunRequest, role: string, from: string, to: string): void {
    log.warn({ role, from, to }, '[Providers] hết quota, chuyển nguồn dự phòng');
    request.onEvent?.({ kind: 'text', text: `Ban Thông tin: ${from} hết quota — chuyển sang ${providerById(to)?.label ?? to}.` });
  }

  /**
   * Bắn thử một nguồn (1 lượt rất nhỏ, không tool) để xác nhận khoá / đăng nhập dùng được.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async test(providerId: string, cwd: string): Promise<{ ok: boolean; text: string; durationMs: number }> {
    const provider = providerById(providerId);
    if (!provider) throw new Error(`Không có nguồn ${providerId}`);
    const result = await this.runWith(
      { provider: providerId, model: provider.engine === 'claude' ? TEST_CLAUDE_MODEL : undefined },
      { cwd, prompt: 'Trả lời đúng một chữ: Rõ', systemPrompt: 'Bạn đang được kiểm tra kết nối.', model: TEST_CLAUDE_MODEL, allowedTools: [], timeoutMs: TEST_TIMEOUT_MS },
    );
    return { ok: result.ok, text: result.text.slice(0, TEST_OUTPUT_MAX), durationMs: result.durationMs };
  }

  /**
   * Chạy request bằng một nguồn cụ thể: kiểm trần chi tiêu, nạp khoá, chọn model, ghi nguồn của phiên.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private async runWith(assignment: Assignment, request: RunRequest): Promise<RunResult> {
    const provider = providerById(assignment.provider) ?? CLAUDE_MAIN;
    if (provider.billing === 'token' && (this.spendToday()[provider.id] ?? 0) >= this.capUsd()) {
      return refusal(`Ban Hậu cần chặn: ${provider.label} đã chạm trần chi tiêu $${this.capUsd()}/ngày. Nâng trần ở màn Env hoặc đổi nguồn.`, provider.id);
    }
    const env: Record<string, string> = { ...request.env };
    if (provider.secretName) {
      const secret = await this.deps.secrets.get(provider.secretName);
      if (!secret) return refusal(`${provider.label} chưa có khoá ${provider.secretName} — thêm ở màn Env (phím \`).`, provider.id);
      for (const name of provider.envNames ?? []) env[name] = secret;
    }
    const sessionKey = request.resumeSessionId ? `${SESSION_KEY_PREFIX}${request.resumeSessionId}` : null;
    const sessionProvider = sessionKey ? this.deps.store.getSetting<string | null>(sessionKey, null) : null;
    const resumeSessionId = sessionProvider && sessionProvider !== provider.id ? null : request.resumeSessionId;
    const model = provider.engine === 'codex' ? (assignment.model ?? '') : (assignment.model ?? request.model);
    const onEvent = request.onEvent;
    const result = await this.deps.engines[provider.engine]({
      ...request,
      env,
      model,
      resumeSessionId,
      onEvent: onEvent && ((event) => onEvent(event.kind === 'quota' ? { ...event, quota: { ...event.quota, provider: provider.id } } : event)),
    });
    if (result.sessionId) this.deps.store.setSetting(`${SESSION_KEY_PREFIX}${result.sessionId}`, provider.id);
    return { ...result, quota: result.quota && { ...result.quota, provider: provider.id }, provider: provider.id };
  }
}
