export type TaskStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'awaiting_answer'
  | 'done'
  | 'failed'
  | 'cancelled';

export type Project = {
  id: string;
  name: string;
  brief: string;
  createdAt: string;
  dir: string | null;
  gitRemote: string | null;
};

export type ReportResult = 'ĐẠT' | 'KHÔNG ĐẠT' | 'CẦN HỎI';

export type AgentReport = {
  mission: string;
  result: ReportResult;
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
  status: TaskStatus;
  gate: boolean;
  feedback: string | null;
  sessionId: string | null;
  model: string | null;
  extraTools: string[];
  deniedTools: string[];
  questions: string[];
  report: AgentReport | null;
  output: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type MessageSender = 'user' | 'manager' | 'system' | 'report' | 'logistics';

export type Message = {
  id: number;
  projectId: string | null;
  sender: MessageSender;
  author: string | null;
  text: string;
  createdAt: string;
};

export type TaskEvent = {
  id: number;
  taskId: number;
  kind: string;
  text: string;
  createdAt: string;
};

export type RoleDefinition = {
  name: string;
  title: string;
  unit: string;
  block: string;
  duty: string;
  skills: string[];
  model: string;
  gate: boolean;
  timeoutMinutes: number;
  allowedTools: string[];
  writes: string[];
  prompt: string;
};

export type QuotaWindow = {
  utilization: number;
  resetsAt: number;
};

export type QuotaSnapshot = {
  status: string;
  fiveHour: QuotaWindow | null;
  sevenDay: QuotaWindow | null;
  updatedAt: number;
  provider?: string;
};

export type RunUsage = {
  inputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
};

export type RunRecord = {
  id: number;
  taskId: number | null;
  projectId: string | null;
  role: string;
  model: string | null;
  ok: boolean;
  startedAt: string;
  durationMs: number;
  usage: RunUsage;
  costUsd: number;
  fiveHourDelta: number | null;
  sevenDayDelta: number | null;
  denials: number;
  provider?: string | null;
};

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

export type StreamEvent =
  | { kind: 'session'; sessionId: string; model: string | null }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; text: string }
  | { kind: 'quota'; quota: QuotaSnapshot }
  | {
      kind: 'result';
      isError: boolean;
      text: string;
      structured: unknown;
      costUsd: number;
      denials: string[];
      usage: RunUsage;
      durationMs: number;
    };

export type RunRequest = {
  cwd: string;
  prompt: string;
  systemPrompt: string;
  model: string;
  allowedTools: string[];
  jsonSchema?: object;
  effort?: string;
  role?: string;
  env?: Record<string, string>;
  timeoutMs: number;
  resumeSessionId?: string | null;
  signal?: AbortSignal;
  onEvent?: (event: StreamEvent) => void;
};

export type RunResult = {
  ok: boolean;
  text: string;
  structured: unknown;
  sessionId: string | null;
  model: string | null;
  isUsageLimit: boolean;
  quota: QuotaSnapshot | null;
  costUsd: number;
  permissionDenials: string[];
  usage: RunUsage;
  durationMs: number;
  provider?: string;
};

export type RunClaude = (request: RunRequest) => Promise<RunResult>;
