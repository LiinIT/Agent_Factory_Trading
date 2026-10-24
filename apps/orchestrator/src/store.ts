import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AgentReport, Message, MessageSender, Project, RunRecord, Task, TaskEvent, TaskStatus } from './types.ts';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brief TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id),
  seq INTEGER NOT NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  expected TEXT NOT NULL DEFAULT '',
  verification TEXT NOT NULL DEFAULT '',
  assigned_by TEXT NOT NULL DEFAULT 'tham-muu-truong',
  status TEXT NOT NULL DEFAULT 'queued',
  gate INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  session_id TEXT,
  model TEXT,
  questions TEXT NOT NULL DEFAULT '[]',
  report TEXT,
  extra_tools TEXT NOT NULL DEFAULT '[]',
  denied_tools TEXT NOT NULL DEFAULT '[]',
  output TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT,
  sender TEXT NOT NULL,
  author TEXT,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  project_id TEXT,
  role TEXT NOT NULL,
  model TEXT,
  ok INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  cache_creation_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  five_hour_delta REAL,
  seven_day_delta REAL,
  denials INTEGER NOT NULL DEFAULT 0,
  provider TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const OPEN_STATUSES: TaskStatus[] = ['queued', 'running', 'awaiting_approval', 'awaiting_answer'];

type TaskRow = Record<string, SQLInputValue>;

export type NewTask = {
  projectId: string;
  role: string;
  title: string;
  detail: string;
  expected?: string;
  verification?: string;
  assignedBy?: string;
  gate: boolean;
  urgent?: boolean;
};

export type TaskPatch = Partial<
  Pick<
    Task,
    | 'status'
    | 'feedback'
    | 'sessionId'
    | 'model'
    | 'output'
    | 'error'
    | 'startedAt'
    | 'finishedAt'
    | 'detail'
    | 'extraTools'
    | 'deniedTools'
    | 'questions'
    | 'report'
  >
>;

const PATCH_COLUMNS: Record<keyof TaskPatch, string> = {
  status: 'status',
  feedback: 'feedback',
  sessionId: 'session_id',
  output: 'output',
  error: 'error',
  startedAt: 'started_at',
  finishedAt: 'finished_at',
  detail: 'detail',
  extraTools: 'extra_tools',
  deniedTools: 'denied_tools',
  model: 'model',
  questions: 'questions',
  report: 'report',
};

/**
 * Lưu trữ SQLite của hệ thống: project, task, tin nhắn, log task, cài đặt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class FactoryStore {
  readonly db: DatabaseSync;

  /**
   * Mở (hoặc tạo) DB ở [path]; `:memory:` cho test.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA);
    this.ensureColumn('tasks', 'extra_tools', "TEXT NOT NULL DEFAULT '[]'");
    this.ensureColumn('tasks', 'denied_tools', "TEXT NOT NULL DEFAULT '[]'");
    this.ensureColumn('tasks', 'expected', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('tasks', 'verification', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('tasks', 'assigned_by', "TEXT NOT NULL DEFAULT 'tham-muu-truong'");
    this.ensureColumn('tasks', 'model', 'TEXT');
    this.ensureColumn('tasks', 'questions', "TEXT NOT NULL DEFAULT '[]'");
    this.ensureColumn('tasks', 'report', 'TEXT');
    this.ensureColumn('messages', 'author', 'TEXT');
    this.ensureColumn('runs', 'provider', 'TEXT');
    this.ensureColumn('projects', 'dir', 'TEXT');
    this.ensureColumn('projects', 'git_remote', 'TEXT');
  }

  /**
   * Thêm cột còn thiếu cho DB tạo từ bản cũ.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!columns.some((item) => item.name === column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  /**
   * Task đang `running` khi server tắt đột ngột → trả về hàng đợi.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  recoverInterruptedTasks(): number {
    const result = this.db
      .prepare(`UPDATE tasks SET status = 'queued', started_at = NULL WHERE status = 'running'`)
      .run();
    return Number(result.changes);
  }

  /**
   * Thêm project mới.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  insertProject(project: Pick<Project, 'id' | 'name' | 'brief'> & { dir?: string | null }): Project {
    this.db
      .prepare('INSERT INTO projects (id, name, brief, dir) VALUES (?, ?, ?, ?)')
      .run(project.id, project.name, project.brief, project.dir ?? null);
    const created = this.getProject(project.id);
    if (!created) throw new Error(`Không tạo được project ${project.id}`);
    return created;
  }

  /**
   * Lấy một project theo id.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  getProject(id: string): Project | undefined {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? toProject(row) : undefined;
  }

  /**
   * Đổi nơi lưu và/hoặc git remote của project (null = bỏ, về mặc định).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  updateProject(id: string, patch: Partial<Pick<Project, 'dir' | 'gitRemote'>>): Project {
    if (patch.dir !== undefined) this.db.prepare('UPDATE projects SET dir = ? WHERE id = ?').run(patch.dir, id);
    if (patch.gitRemote !== undefined) this.db.prepare('UPDATE projects SET git_remote = ? WHERE id = ?').run(patch.gitRemote, id);
    const updated = this.getProject(id);
    if (!updated) throw new Error(`Không có project ${id}`);
    return updated;
  }

  /**
   * Xoá project khỏi DB cùng nhiệm vụ, nhật ký nhiệm vụ và tin nhắn của nó (một giao dịch);
   * giữ lại lịch sử thiệt hại (`runs`) để số liệu chi phí không bị mất.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  deleteProject(id: string): void {
    this.db.exec('BEGIN');
    try {
      this.db.prepare('DELETE FROM task_events WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)').run(id);
      this.db.prepare('DELETE FROM tasks WHERE project_id = ?').run(id);
      this.db.prepare('DELETE FROM messages WHERE project_id = ?').run(id);
      this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Toàn bộ project, mới nhất trước.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  listProjects(): Project[] {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC, id').all().map(toProject);
  }

  /**
   * Thêm task vào cuối hàng của project; `urgent` thì chen lên trước mọi task
   * còn đang chờ (dùng cho task sửa lỗi QA).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  insertTask(task: NewTask): Task {
    const seq = task.urgent ? this.firstQueuedSeq(task.projectId) : null;
    this.db.exec('BEGIN');
    try {
      if (seq !== null) {
        this.db
          .prepare('UPDATE tasks SET seq = seq + 1 WHERE project_id = ? AND seq >= ?')
          .run(task.projectId, seq);
      }
      const finalSeq = seq ?? this.nextSeq(task.projectId);
      const result = this.db
        .prepare(
          `INSERT INTO tasks (project_id, seq, role, title, detail, expected, verification, assigned_by, gate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          task.projectId,
          finalSeq,
          task.role,
          task.title,
          task.detail,
          task.expected ?? '',
          task.verification ?? '',
          task.assignedBy ?? 'tham-muu-truong',
          task.gate ? 1 : 0,
        );
      this.db.exec('COMMIT');
      return this.requireTask(Number(result.lastInsertRowid));
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * seq của task `queued` đầu tiên trong project; không có thì null.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private firstQueuedSeq(projectId: string): number | null {
    const row = this.db
      .prepare(`SELECT MIN(seq) AS seq FROM tasks WHERE project_id = ? AND status = 'queued'`)
      .get(projectId) as { seq: number | null };
    return row.seq;
  }

  /**
   * seq kế tiếp ở cuối hàng của project.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  private nextSeq(projectId: string): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS seq FROM tasks WHERE project_id = ?')
      .get(projectId) as { seq: number };
    return row.seq;
  }

  /**
   * Lấy task theo id.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  getTask(id: number): Task | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? toTask(row) : undefined;
  }

  /**
   * Lấy task theo id, không có thì ném lỗi.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  requireTask(id: number): Task {
    const task = this.getTask(id);
    if (!task) throw new Error(`Không có task #${id}`);
    return task;
  }

  /**
   * Toàn bộ task theo thứ tự project + seq; lọc theo project nếu có.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  listTasks(projectId?: string): Task[] {
    const rows = projectId
      ? this.db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY seq').all(projectId)
      : this.db.prepare('SELECT * FROM tasks ORDER BY project_id, seq').all();
    return rows.map(toTask);
  }

  /**
   * Cập nhật một số trường của task.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  updateTask(id: number, patch: TaskPatch): Task {
    const entries = Object.entries(patch).map(([key, value]) => [
      key,
      value !== null && typeof value === 'object' ? JSON.stringify(value) : value,
    ]) as [keyof TaskPatch, SQLInputValue][];
    if (entries.length > 0) {
      const assignments = entries.map(([key]) => `${PATCH_COLUMNS[key]} = ?`).join(', ');
      this.db
        .prepare(`UPDATE tasks SET ${assignments} WHERE id = ?`)
        .run(...entries.map(([, value]) => value ?? null), id);
    }
    return this.requireTask(id);
  }

  /**
   * Task kế tiếp được chạy: trong mỗi project, task đầu tiên chưa xong phải đang
   * `queued` (task trước đang chạy / chờ duyệt / lỗi thì project đó bị chặn).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  nextRunnableTask(): Task | undefined {
    const row = this.db
      .prepare(
        `SELECT t.* FROM tasks t
         WHERE t.status = 'queued'
           AND NOT EXISTS (
             SELECT 1 FROM tasks earlier
             WHERE earlier.project_id = t.project_id
               AND earlier.seq < t.seq
               AND earlier.status NOT IN ('done', 'cancelled')
           )
         ORDER BY t.created_at, t.id
         LIMIT 1`,
      )
      .get();
    return row ? toTask(row) : undefined;
  }

  /**
   * Project còn task nào đang mở (chờ chạy / đang chạy / chờ duyệt) không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  hasOpenTasks(projectId: string): boolean {
    const placeholders = OPEN_STATUSES.map(() => '?').join(', ');
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM tasks WHERE project_id = ? AND status IN (${placeholders})`)
      .get(projectId, ...OPEN_STATUSES) as { count: number };
    return row.count > 0;
  }

  /**
   * Đã có task mở cùng tên trong project chưa (chống quản lý tạo trùng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  hasOpenTaskTitled(projectId: string, title: string): boolean {
    return this.listTasks(projectId).some(
      (task) => OPEN_STATUSES.includes(task.status) && task.title.trim() === title.trim(),
    );
  }

  /**
   * Lưu một tin nhắn hội thoại.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  addMessage(sender: MessageSender, text: string, projectId: string | null = null, author: string | null = null): Message {
    const result = this.db
      .prepare('INSERT INTO messages (project_id, sender, author, text) VALUES (?, ?, ?, ?)')
      .run(projectId, sender, author, text);
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    return toMessage(row as TaskRow);
  }

  /**
   * [limit] tin nhắn gần nhất, cũ trước.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  recentMessages(limit: number): Message[] {
    return this.db
      .prepare('SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT ?) ORDER BY id')
      .all(limit)
      .map(toMessage);
  }

  /**
   * Ghi một dòng log của task.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  addTaskEvent(taskId: number, kind: string, text: string): TaskEvent {
    const result = this.db
      .prepare('INSERT INTO task_events (task_id, kind, text) VALUES (?, ?, ?)')
      .run(taskId, kind, text);
    const row = this.db.prepare('SELECT * FROM task_events WHERE id = ?').get(result.lastInsertRowid);
    return toTaskEvent(row as TaskRow);
  }

  /**
   * [limit] dòng log gần nhất của task, cũ trước.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  taskEvents(taskId: number, limit: number): TaskEvent[] {
    return this.db
      .prepare(
        'SELECT * FROM (SELECT * FROM task_events WHERE task_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id',
      )
      .all(taskId, limit)
      .map(toTaskEvent);
  }

  /**
   * Ghi một lần chạy agent (Ban Hậu cần dùng để tính thiệt hại).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  insertRun(run: Omit<RunRecord, 'id'>): RunRecord {
    const result = this.db
      .prepare(
        `INSERT INTO runs (task_id, project_id, role, model, ok, started_at, duration_ms, input_tokens,
           cache_creation_tokens, cache_read_tokens, output_tokens, cost_usd, five_hour_delta, seven_day_delta, denials, provider)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        run.taskId,
        run.projectId,
        run.role,
        run.model,
        run.ok ? 1 : 0,
        run.startedAt,
        run.durationMs,
        run.usage.inputTokens,
        run.usage.cacheCreationTokens,
        run.usage.cacheReadTokens,
        run.usage.outputTokens,
        run.costUsd,
        run.fiveHourDelta,
        run.sevenDayDelta,
        run.denials,
        run.provider ?? null,
      );
    return { ...run, id: Number(result.lastInsertRowid) };
  }

  /**
   * Các lần chạy, lọc theo task / project / mốc thời gian bắt đầu (ISO).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  listRuns(filter: { taskId?: number; projectId?: string; since?: string } = {}): RunRecord[] {
    const conditions: string[] = [];
    const values: SQLInputValue[] = [];
    if (filter.taskId !== undefined) {
      conditions.push('task_id = ?');
      values.push(filter.taskId);
    }
    if (filter.projectId !== undefined) {
      conditions.push('project_id = ?');
      values.push(filter.projectId);
    }
    if (filter.since !== undefined) {
      conditions.push('started_at >= ?');
      values.push(filter.since);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return this.db.prepare(`SELECT * FROM runs ${where} ORDER BY id`).all(...values).map(toRun);
  }

  /**
   * Đọc một cài đặt dạng JSON.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  getSetting<T>(key: string, fallback: T): T {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row ? (JSON.parse(row.value) as T) : fallback;
  }

  /**
   * Ghi một cài đặt dạng JSON.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  setSetting(key: string, value: unknown): void {
    this.db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      )
      .run(key, JSON.stringify(value));
  }
}

/**
 * Dòng DB → Project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toProject(row: TaskRow): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    brief: String(row.brief),
    createdAt: String(row.created_at),
    dir: row.dir ? String(row.dir) : null,
    gitRemote: row.git_remote ? String(row.git_remote) : null,
  };
}

/**
 * Dòng DB → Task.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toTask(row: TaskRow): Task {
  return {
    id: Number(row.id),
    projectId: String(row.project_id),
    seq: Number(row.seq),
    role: String(row.role),
    title: String(row.title),
    detail: String(row.detail),
    status: String(row.status) as TaskStatus,
    gate: Number(row.gate) === 1,
    feedback: nullableString(row.feedback),
    sessionId: nullableString(row.session_id),
    model: nullableString(row.model),
    expected: String(row.expected ?? ''),
    verification: String(row.verification ?? ''),
    assignedBy: String(row.assigned_by ?? 'tham-muu-truong'),
    questions: parseList(row.questions),
    report: parseReportColumn(row.report),
    extraTools: parseList(row.extra_tools),
    deniedTools: parseList(row.denied_tools),
    output: nullableString(row.output),
    error: nullableString(row.error),
    createdAt: String(row.created_at),
    startedAt: nullableString(row.started_at),
    finishedAt: nullableString(row.finished_at),
  };
}

/**
 * Dòng DB → Message.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toMessage(row: TaskRow): Message {
  return {
    id: Number(row.id),
    projectId: nullableString(row.project_id),
    sender: String(row.sender) as MessageSender,
    author: nullableString(row.author),
    text: String(row.text),
    createdAt: String(row.created_at),
  };
}

/**
 * Dòng DB → TaskEvent.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toTaskEvent(row: TaskRow): TaskEvent {
  return {
    id: Number(row.id),
    taskId: Number(row.task_id),
    kind: String(row.kind),
    text: String(row.text),
    createdAt: String(row.created_at),
  };
}

/**
 * Dòng DB → RunRecord.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function toRun(row: TaskRow): RunRecord {
  return {
    id: Number(row.id),
    taskId: row.task_id === null ? null : Number(row.task_id),
    projectId: nullableString(row.project_id),
    role: String(row.role),
    model: nullableString(row.model),
    ok: Number(row.ok) === 1,
    startedAt: String(row.started_at),
    durationMs: Number(row.duration_ms),
    usage: {
      inputTokens: Number(row.input_tokens),
      cacheCreationTokens: Number(row.cache_creation_tokens),
      cacheReadTokens: Number(row.cache_read_tokens),
      outputTokens: Number(row.output_tokens),
    },
    costUsd: Number(row.cost_usd),
    fiveHourDelta: row.five_hour_delta === null ? null : Number(row.five_hour_delta),
    sevenDayDelta: row.seven_day_delta === null ? null : Number(row.seven_day_delta),
    denials: Number(row.denials),
    provider: nullableString(row.provider),
  };
}

/**
 * Cột JSON báo cáo → AgentReport (sai định dạng thì null).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function parseReportColumn(value: SQLInputValue | undefined): AgentReport | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(String(value)) as AgentReport;
  } catch {
    return null;
  }
}

/**
 * Cột JSON danh sách chuỗi → mảng (sai định dạng thì rỗng).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function parseList(value: SQLInputValue | undefined): string[] {
  try {
    const parsed = JSON.parse(String(value ?? '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Giá trị DB → string hoặc null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function nullableString(value: SQLInputValue | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}
