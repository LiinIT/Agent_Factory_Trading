import type { AccountStatus, DamageReport, Project, PushResult, EnvSnapshot, FactoryMode, FactoryState, TaskEvent } from './types';

export type TaskAction = 'approve' | 'reject' | 'retry' | 'cancel';

/**
 * Gọi API orchestrator qua proxy `/api`; lỗi HTTP ném Error kèm thông báo của server.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Lỗi ${response.status}`);
  return data as T;
}

export const api = {
  state: () => request<FactoryState>('state'),
  taskEvents: (taskId: number) => request<TaskEvent[]>(`tasks/${taskId}/events`),
  chat: (text: string, projectId: string | null) => request('chat', { text, projectId }),
  taskAction: (taskId: number, action: TaskAction, feedback?: string) =>
    request(`tasks/${taskId}/${action}`, { feedback }),
  grant: (taskId: number, tool: string) => request(`tasks/${taskId}/grant`, { tool }),
  answer: (taskId: number, answer: string) => request(`tasks/${taskId}/answer`, { answer }),
  damage: () => request<DamageReport>('damage'),
  briefing: () => request<{ text: string; source: 'ollama' | 'may' }>('briefing'),
  setMode: (mode: FactoryMode) => request<{ mode: FactoryMode }>('mode', { mode }),
  env: () => request<EnvSnapshot>('env'),
  setSecret: (name: string, value: string) => request<EnvSnapshot>('env/secret', { name, value }),
  deleteSecret: (name: string) => request<EnvSnapshot>('env/secret/delete', { name }),
  assignProvider: (role: string, provider: string, model: string) => request<EnvSnapshot>('env/assign', { role, provider, model }),
  setFallback: (provider: string | null) => request<EnvSnapshot>('env/fallback', { provider }),
  setSpendCap: (usd: number) => request<EnvSnapshot>('env/cap', { usd }),
  testProvider: (provider: string) => request<{ ok: boolean; text: string; durationMs: number }>('env/test', { provider }),
  accounts: () => request<AccountStatus>('accounts'),
  useAccount: (provider: string) => request<AccountStatus>('accounts/use', { provider }),
  saveAltToken: (token: string) => request<AccountStatus>('accounts/token', { token }),
  moveProject: (projectId: string, dir: string) => request<Project>(`projects/${projectId}/dir`, { dir }),
  setProjectRemote: (projectId: string, url: string) => request<Project>(`projects/${projectId}/remote`, { url }),
  pushProject: (projectId: string) => request<PushResult>(`projects/${projectId}/push`, {}),
  deleteProject: (projectId: string, confirmName: string) =>
    request<{ deleted: string; trashed: string | null }>(`projects/${projectId}/delete`, { confirmName }),
  setPaused: (paused: boolean) => request(`queue/${paused ? 'pause' : 'resume'}`, {}),
};
