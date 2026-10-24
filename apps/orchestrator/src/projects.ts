import { execFile, execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { FactoryBus } from './bus.ts';
import { log } from './logger.ts';
import { PENDING_RETRY_KEY } from './manager.ts';
import { resolveProjectDir, validateGitRemote, type LocationRules } from './project-location.ts';
import { describeFinding, forbiddenPathReason, scanSecrets, type SecretFinding } from './secret-scan.ts';
import type { FactoryStore } from './store.ts';
import type { Project } from './types.ts';
import type { Workspace } from './workspace.ts';

const REMOTE_NAME = 'origin';
const PUSH_TIMEOUT_MS = 120_000;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const OUTPUT_TAIL = 800;
const MAX_FINDINGS_SHOWN = 10;
const TRASH_BIN = '/usr/bin/trash';
const GENERATED_AT_ROOT = new Set(['build', '.dart_tool', '.flutter-plugins-dependencies', 'node_modules', '.next', 'dist', 'coverage']);
const GENERATED_SUFFIX = '.iml';

export type PushResult = { ok: boolean; output: string };

export type ProjectDeskDeps = {
  store: FactoryStore;
  workspace: Workspace;
  bus: FactoryBus;
  rules: LocationRules;
  moveToTrash?: (path: string) => Promise<void>;
};

/**
 * Chạy git đồng bộ trong [cwd], trả stdout.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * Quét mọi file git đang theo dõi trong repo: file cấm + key/token (bỏ qua nhị phân, file lớn).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function scanRepo(dir: string): SecretFinding[] {
  const files = git(dir, ['ls-files', '-z']).split('\0').filter(Boolean);
  return files.flatMap((file) => {
    const reason = forbiddenPathReason(file);
    if (reason) return [{ file, line: null, kind: `file cấm đưa lên repo: ${reason}`, preview: '' }];
    const path = join(dir, file);
    const stat = statSync(path, { throwIfNoEntry: false });
    if (!stat?.isFile() || stat.size > MAX_SCAN_BYTES) return [];
    const content = readFileSync(path);
    return content.includes(0) ? [] : scanSecrets(file, content.toString('utf8'));
  });
}

/**
 * Quản lý nơi lưu và git của từng project theo lệnh Chỉ huy trưởng: chuyển thư mục, gắn
 * remote, push tay. Agent không bao giờ push — chỉ nút của Chỉ huy trưởng gọi tới đây.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export class ProjectDesk {
  readonly deps: ProjectDeskDeps;

  /**
   * Khởi tạo với store, workspace và quy tắc nơi lưu.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  constructor(deps: ProjectDeskDeps) {
    this.deps = deps;
  }

  /**
   * Kiểm nơi lưu Chỉ huy trưởng nhập (dùng cả khi Tham mưu trưởng lập project).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  resolveDir = (input: string): string => resolveProjectDir(input, this.deps.rules);

  /**
   * Chuyển project sang nơi lưu mới ([input] rỗng = về nơi mặc định `<workspaceDir>/<id>`); xoá phiên agent cũ
   * vì phiên gắn với đường dẫn cũ. Không chuyển khi đang có nhiệm vụ chạy.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  moveDir(projectId: string, input: string): Project {
    const { store, workspace, bus } = this.deps;
    this.requireIdle(projectId);
    const target = input.trim() ? this.resolveDir(input) : workspace.defaultDir(projectId);
    workspace.move(projectId, target);
    const project = store.updateProject(projectId, { dir: input.trim() ? target : null });
    for (const task of store.listTasks(projectId)) {
      if (task.sessionId) store.updateTask(task.id, { sessionId: null });
    }
    bus.publish({ type: 'state' });
    return project;
  }

  /**
   * Gắn (hoặc đổi) git remote `origin`; [input] rỗng = gỡ remote.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  setRemote(projectId: string, input: string): Project {
    const { store, workspace, bus } = this.deps;
    const url = input.trim() ? validateGitRemote(input) : null;
    const dir = workspace.projectDir(this.requireProject(projectId).id);
    const hasOrigin = git(dir, ['remote']).split('\n').includes(REMOTE_NAME);
    if (url) {
      git(dir, ['remote', hasOrigin ? 'set-url' : 'add', REMOTE_NAME, url]);
      log.info({ projectId, url }, '[ProjectDesk] gắn git remote');
    } else {
      if (hasOrigin) git(dir, ['remote', 'remove', REMOTE_NAME]);
      log.info({ projectId }, '[ProjectDesk] gỡ git remote');
    }
    const project = store.updateProject(projectId, { gitRemote: url });
    bus.publish({ type: 'state' });
    return project;
  }

  /**
   * Push nhánh hiện tại lên remote — chỉ khi Chỉ huy trưởng bấm. Quét key/file cấm trước,
   * có thì chặn; git không được hỏi mật khẩu (dùng SSH key / credential sẵn có trên máy).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async push(projectId: string): Promise<PushResult> {
    const project = this.requireProject(projectId);
    if (!project.gitRemote) throw new Error('Project chưa gắn git remote.');
    this.requireIdle(projectId);
    const dir = this.deps.workspace.projectDir(projectId);
    const findings = scanRepo(dir);
    if (findings.length > 0) {
      log.warn({ projectId, count: findings.length }, '[ProjectDesk] chặn push vì có bí mật');
      const shown = findings.slice(0, MAX_FINDINGS_SHOWN).map(describeFinding).join('\n');
      return { ok: false, output: `Chặn push: tìm thấy ${findings.length} bí mật / file cấm — gỡ khỏi repo rồi push lại.\n${shown}` };
    }
    log.info({ projectId, remote: project.gitRemote }, '[ProjectDesk] push');
    return runPush(dir);
  }

  /**
   * Xoá project: [confirmName] phải gõ đúng tên project; không xoá khi đang có nhiệm vụ chạy.
   * Thư mục source chuyển vào Thùng rác (khôi phục được) trước — lỗi thì dừng, DB giữ nguyên;
   * xong mới gỡ project, nhiệm vụ, tin nhắn khỏi DB.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  async deleteProject(projectId: string, confirmName: string): Promise<{ deleted: string; trashed: string | null }> {
    const { store, workspace, bus } = this.deps;
    const project = this.requireProject(projectId);
    if (confirmName.trim() !== project.name.trim()) throw new Error(`Gõ đúng tên project "${project.name}" để xác nhận xoá.`);
    this.requireIdle(projectId);
    const dir = workspace.projectDir(projectId);
    const trashed = existsSync(dir) ? dir : null;
    if (trashed) await (this.deps.moveToTrash ?? moveToMacTrash)(trashed);
    store.deleteProject(projectId);
    if (store.getSetting<{ projectId?: string | null } | null>(PENDING_RETRY_KEY, null)?.projectId === projectId) store.setSetting(PENDING_RETRY_KEY, null);
    log.info({ projectId, trashed }, '[ProjectDesk] xoá project');
    bus.publish({ type: 'state' });
    return { deleted: projectId, trashed };
  }

  /**
   * Dọn file sinh tự động ở gốc project (build, .dart_tool, node_modules, *.iml…) vào Thùng rác —
   * khôi phục được. Mục lỡ bị commit thì gỡ khỏi git (`--cached`), thêm vào `.gitignore` gốc, commit trước.
   * Trả danh sách đã dọn.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-20
   */
  async cleanGenerated(projectId: string): Promise<string[]> {
    this.requireIdle(projectId);
    const { workspace } = this.deps;
    const dir = workspace.projectDir(projectId);
    const generated = readdirSync(dir).filter((name) => GENERATED_AT_ROOT.has(name) || name.endsWith(GENERATED_SUFFIX));
    const tracked = generated.filter((name) => git(dir, ['ls-files', '--', name]).trim() !== '');
    if (tracked.length > 0) {
      git(dir, ['rm', '-r', '-q', '--cached', '--', ...tracked]);
      ignoreAtRoot(dir, tracked);
      workspace.commitAll(projectId, `chore: gỡ file sinh tự động khỏi git (${tracked.join(', ')})`);
    }
    for (const name of generated) await (this.deps.moveToTrash ?? moveToMacTrash)(join(dir, name));
    log.info({ projectId, trashed: generated, untracked: tracked }, '[ProjectDesk] dọn file sinh tự động');
    return generated;
  }

  /**
   * Bổ sung khung chuẩn còn thiếu (be/, web/, dev, docker-compose…) vào project cũ rồi commit.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-20
   */
  applyBase(projectId: string): string[] {
    this.requireIdle(projectId);
    const { workspace, bus } = this.deps;
    const added = workspace.applyBase(projectId);
    if (added.length > 0) workspace.commitAll(projectId, `chore: bổ sung khung chuẩn (${added.join(', ')})`);
    bus.publish({ type: 'state' });
    return added;
  }

  /**
   * Project phải tồn tại.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private requireProject(projectId: string): Project {
    const project = this.deps.store.getProject(projectId);
    if (!project) throw new Error(`Không có project ${projectId}`);
    return project;
  }

  /**
   * Project không được có nhiệm vụ đang chạy (agent đang ghi file trong thư mục).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  private requireIdle(projectId: string): void {
    this.requireProject(projectId);
    if (this.deps.store.listTasks(projectId).some((task) => task.status === 'running')) {
      throw new Error('Project đang có nhiệm vụ chạy — chờ xong hoặc tạm dừng hàng đợi rồi làm lại.');
    }
  }
}

/**
 * Thêm [names] vào `.gitignore` ở gốc [dir] (dạng `/tên/`), bỏ qua dòng đã có.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function ignoreAtRoot(dir: string, names: string[]): void {
  const path = join(dir, '.gitignore');
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = new Set(current.split('\n').map((line) => line.trim()));
  const missing = names.map((name) => `/${name}${statSync(join(dir, name)).isDirectory() ? '/' : ''}`).filter((line) => !lines.has(line));
  if (missing.length === 0) return;
  const separator = current === '' || current.endsWith('\n') ? '' : '\n';
  writeFileSync(path, `${current}${separator}${missing.join('\n')}\n`);
}

/**
 * Chuyển thư mục vào Thùng rác macOS bằng `/usr/bin/trash` (giữ được "Put Back").
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function moveToMacTrash(path: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    execFile(TRASH_BIN, [path], (error, _stdout, stderr) => {
      if (error) reject(new Error(`Không chuyển được ${path} vào Thùng rác: ${stderr.trim() || error.message}`));
      else resolvePromise();
    });
  });
}

/**
 * `git push -u origin HEAD`, không cho git hỏi mật khẩu, giới hạn thời gian; trả kết quả + đuôi output.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function runPush(dir: string): Promise<PushResult> {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes' };
  return new Promise((resolvePromise) => {
    execFile('git', ['push', '-u', REMOTE_NAME, 'HEAD'], { cwd: dir, env, timeout: PUSH_TIMEOUT_MS }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`.trim().slice(-OUTPUT_TAIL);
      if (error) log.warn({ dir, output }, '[ProjectDesk] push lỗi');
      resolvePromise({ ok: !error, output: output || (error ? String(error) : 'Đã push.') });
    });
  });
}
