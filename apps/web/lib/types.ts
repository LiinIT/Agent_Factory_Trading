export type TaskStatus = 'queued' | 'running' | 'awaiting_approval' | 'awaiting_answer' | 'done' | 'failed' | 'cancelled';

export type Project = {
  id: string;
  name: string;
  brief: string;
  createdAt: string;
  hasPrototype: boolean;
  dir: string | null;
  path: string;
  gitRemote: string | null;
};

export type PushResult = { ok: boolean; output: string };

export type AgentReport = {
  mission: string;
  result: 'ĐẠT' | 'KHÔNG ĐẠT' | 'CẦN HỎI';
  evidence: string;
  obstacles: string;
  questions: string[];
  proposal: string;
  howToRun: string;
};

export type Task = {
  id: number;
  projectId: string;
  seq: number;
  role: string;
  title: string;
  detail: string;
  expected: string;
  verification: string;
  assignedBy: string;
  model: string | null;
  questions: string[];
  report: AgentReport | null;
  status: TaskStatus;
  gate: boolean;
  feedback: string | null;
  extraTools: string[];
  deniedTools: string[];
  output: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type Message = {
  id: number;
  projectId: string | null;
  sender: 'user' | 'manager' | 'system' | 'report' | 'logistics';
  author: string | null;
  text: string;
  createdAt: string;
};

export type AccountInfo = {
  id: string;
  label: string;
  hasLogin: boolean;
  isPreferred: boolean;
  isFallback: boolean;
  pausedUntil: number | null;
  fiveHour: number | null;
  sevenDay: number | null;
};

export type AccountStatus = { accounts: AccountInfo[]; next: string | null; pendingRetry: boolean };

export const ACCOUNT_CARD_AUTHOR = 'doi-tai-khoan';

export type TaskEvent = { id: number; taskId: number; kind: string; text: string; createdAt: string };

export type QuotaWindow = { utilization: number; resetsAt: number };

export type TeamRole = { name: string; title: string; unit: string; block: string; duty: string; model: string; gate: boolean };

export type FactoryMode = 'chuan' | 'ta-mon';

export type DamageTotals = {
  runs: number;
  failures: number;
  denials: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  fiveHourDelta: number;
  sevenDayDelta: number;
};

export type DamageReport = {
  today: DamageTotals;
  byTask: Record<string, DamageTotals>;
  byProject: Record<string, DamageTotals>;
  byDay: Record<string, DamageTotals>;
  byRole: Record<string, DamageTotals>;
};

export type FactoryState = {
  mode: FactoryMode;
  team: TeamRole[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  quota: { status: string; fiveHour: QuotaWindow | null; sevenDay: QuotaWindow | null } | null;
  pause: { manual: boolean; until: number | null };
  runningTaskIds: number[];
  managerBusy: boolean;
  damage: Pick<DamageReport, 'today' | 'byTask' | 'byRole'>;
};

export type BusEvent =
  | { type: 'state' }
  | { type: 'log'; taskId: number; kind: string; text: string }
  | { type: 'manager'; busy: boolean };

export type EnvProvider = {
  id: string;
  label: string;
  engine: 'claude' | 'codex';
  billing: 'goi' | 'token';
  secretName?: string;
  models: string[];
  note: string;
  hasSecret: boolean;
  hint: string | null;
  status: { ok: boolean; detail: string };
};

export type EnvSnapshot = {
  providers: EnvProvider[];
  ollama: { model: string; status: { ok: boolean; detail: string } };
  assignments: Record<string, { provider: string; model?: string }>;
  fallback: string | null;
  capUsd: number;
  spendToday: Record<string, number>;
  roles: { name: string; unit: string; model: string }[];
};
