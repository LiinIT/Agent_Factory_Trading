import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { type BaseDefinition, matchingDirs, projectPrefix, resolvePartDir } from './bases.ts';
import { log } from './logger.ts';
import { scrubCommitMessage, scrubText } from './scrub.ts';

const MAX_SLUG_LENGTH = 40;
const DEFAULT_SLUG = 'project';
const DS_STORE = '.DS_Store';
const GITIGNORE = '.gitignore';
const MAX_SCRUB_BYTES = 2 * 1024 * 1024;

export type WorkspaceDirs = {
  workspaceDir: string;
  templateDir: string;
  skillsDir: string;
  base?: BaseDefinition | null;
  projectPath?: (projectId: string) => string | null;
};

/**
 * Tên tiếng Việt → slug a-z0-9 dùng làm id và tên thư mục project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || DEFAULT_SLUG;
}

/**
 * Quản lý thư mục `<workspaceDir>/<id>` của từng project: tạo từ template, chép
 * skill, khởi tạo git, commit sau mỗi task. Chỉ git local — không bao giờ push.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class Workspace {
  readonly dirs: WorkspaceDirs;

  /**
   * Khởi tạo với các thư mục gốc.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(dirs: WorkspaceDirs) {
    this.dirs = dirs;
  }

  /**
   * Đường dẫn thư mục của project [projectId]: nơi lưu Chỉ huy trưởng chọn, không có thì `<workspaceDir>/<id>`.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  projectDir(projectId: string): string {
    return this.dirs.projectPath?.(projectId) ?? this.defaultDir(projectId);
  }

  /**
   * Nơi lưu mặc định của project: `<workspaceDir>/<id>` (cấu hình `workspaceDir`, hiện là `workspace_apps_dv0`).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  defaultDir(projectId: string): string {
    return join(this.dirs.workspaceDir, projectId);
  }

  /**
   * Chuyển cả thư mục project (kèm git) sang [target]; khác ổ đĩa thì chép rồi xoá bản cũ.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-17
   */
  move(projectId: string, target: string): void {
    const source = this.projectDir(projectId);
    if (source === target) return;
    try {
      renameSync(source, target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
      cpSync(source, target, { recursive: true });
      rmSync(source, { recursive: true, force: true });
    }
    log.info({ projectId, from: source, to: target }, '[Workspace] chuyển nơi lưu project');
  }

  /**
   * id chưa trùng thư mục nào, dựa trên [name] (thêm -2, -3… khi trùng).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  uniqueId(name: string, isTaken: (id: string) => boolean): string {
    const base = slugify(name);
    let candidate = base;
    for (let suffix = 2; isTaken(candidate) || existsSync(this.projectDir(candidate)); suffix++) {
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  /**
   * Tạo thư mục project ở [dir] (mặc định `<workspaceDir>/<id>`): base barem (nếu có) + template
   * + skill vào `.claude/skills`, ghi brief, git init.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  create(projectId: string, name: string, brief: string, dir: string = this.defaultDir(projectId)): void {
    mkdirSync(dir, { recursive: true });
    const base = this.dirs.base;
    if (base && existsSync(base.dir)) {
      cpSync(base.dir, dir, { recursive: true, filter: (source) => !isExcluded(relative(base.dir, source), base.exclude) });
      renameForProject(base, dir, projectId, readdirSync(base.dir));
    }
    cpSync(this.dirs.templateDir, dir, { recursive: true });
    cpSync(this.dirs.skillsDir, join(dir, '.claude/skills'), { recursive: true });
    writeFileSync(join(dir, 'brain/brief.md'), `# ${name}\n\n${brief}\n`);
    git(dir, ['init', '-q', '-b', 'main']);
    commitIn(dir, `chore: khởi tạo project ${name}`);
    log.info({ projectId, dir }, '[Workspace] tạo project');
  }

  /**
   * Commit mọi thay đổi trong project (đã lọc dấu ký Apple và dấu AI); không có gì
   * thay đổi thì bỏ qua.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  commitAll(projectId: string, message: string): boolean {
    return commitIn(this.projectDir(projectId), message);
  }

  /**
   * Bổ sung vào project cũ những phần của base còn thiếu (vd `be/`, `web/`, `dev`, docker-compose):
   * phần đã có file nhận diện (ở thư mục chuẩn hoặc `fallbackDir`) thì bỏ qua, không ghi đè file nào.
   * Trả danh sách mục đã thêm.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-20
   */
  applyBase(projectId: string): string[] {
    const base = this.dirs.base;
    if (!base || !existsSync(base.dir)) throw new Error('Chưa có base barem để bổ sung.');
    const dir = this.projectDir(projectId);
    const added: string[] = [];
    const copied: string[] = [];
    for (const entry of readdirSync(base.dir)) {
      if (entry === DS_STORE || isExcluded(entry, base.exclude)) continue;
      if (entry === GITIGNORE && existsSync(join(dir, GITIGNORE))) {
        if (mergeIgnoreLines(join(base.dir, GITIGNORE), join(dir, GITIGNORE))) added.push(`${GITIGNORE} (gộp dòng thiếu)`);
        continue;
      }
      const target = renamedEntry(base, entry, projectId);
      const part = base.parts.find((item) => matchingDirs(base.dir, item.dir).includes(entry));
      const isPresent = part ? resolvePartDir(dir, part) !== null : existsSync(join(dir, target));
      if (isPresent) continue;
      cpSync(join(base.dir, entry), join(dir, target), {
        recursive: true,
        force: false,
        filter: (source) => !source.endsWith(DS_STORE) && !isExcluded(relative(base.dir, source), base.exclude),
      });
      copied.push(entry);
      added.push(target);
    }
    renameForProject(base, dir, projectId, copied, false);
    log.info({ projectId, added }, '[Workspace] bổ sung khung chuẩn');
    return added;
  }
}

/**
 * Tên mục [entry] của base trong project: `project_app` → `<tiền tố>_app` (base có `rename`), còn lại giữ nguyên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
function renamedEntry(base: BaseDefinition, entry: string, projectId: string): string {
  const from = base.rename?.from;
  if (!from || !entry.startsWith(`${from}_`)) return entry;
  return `${projectPrefix(projectId)}${entry.slice(from.length)}`;
}

/**
 * Sau khi chép [entries] của base vào [dir]: đổi tên thư mục `project_*` theo project (khi [shouldRenameDirs])
 * và thay tên đó trong các file `rename.files` vừa chép (docker-compose, README, package.json…).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
function renameForProject(base: BaseDefinition, dir: string, projectId: string, entries: string[], shouldRenameDirs = true): void {
  const rename = base.rename;
  if (!rename) return;
  if (shouldRenameDirs) {
    for (const entry of entries) {
      const target = renamedEntry(base, entry, projectId);
      if (target !== entry && existsSync(join(dir, entry))) renameSync(join(dir, entry), join(dir, target));
    }
  }
  const prefix = projectPrefix(projectId);
  const suffixes = base.parts.map((part) => part.dir).filter((pattern) => pattern.startsWith('*_')).map((pattern) => pattern.slice(2));
  for (const file of rename.files) {
    const [first = '', ...rest] = file.split('/');
    if (!entries.includes(first)) continue;
    const path = join(dir, renamedEntry(base, first, projectId), ...rest);
    if (!existsSync(path)) continue;
    writeFileSync(path, renderProjectNames(readFileSync(path, 'utf8'), rename.from, prefix, suffixes));
  }
}

/**
 * Thay `project_app` / `project_server`… và tên compose `project` trong [text] bằng tên của project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
export function renderProjectNames(text: string, from: string, prefix: string, suffixes: string[]): string {
  const partNames = new RegExp(`\\b${from}_(${suffixes.join('|')})\\b`, 'g');
  return text
    .replace(partNames, `${prefix}_$1`)
    .replace(new RegExp(`COMPOSE_PROJECT_NAME:-${from}\\}`, 'g'), `COMPOSE_PROJECT_NAME:-${prefix}}`)
    .replace(new RegExp(`^COMPOSE_PROJECT_NAME=${from}$`, 'gm'), `COMPOSE_PROJECT_NAME=${prefix}`);
}

/**
 * Gộp vào [targetPath] các dòng luật của [sourcePath] còn thiếu (bỏ dòng trống / chú thích); trả true nếu có thêm.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function mergeIgnoreLines(sourcePath: string, targetPath: string): boolean {
  const current = readFileSync(targetPath, 'utf8');
  const existing = new Set(current.split('\n').map((line) => line.trim()));
  const missing = readFileSync(sourcePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#') && !existing.has(line));
  if (missing.length === 0) return false;
  const separator = current === '' || current.endsWith('\n') ? '' : '\n';
  writeFileSync(targetPath, `${current}${separator}${missing.join('\n')}\n`);
  return true;
}

/**
 * Commit mọi thay đổi trong repo [dir] sau khi lọc dấu; không có gì thay đổi thì bỏ qua.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function commitIn(dir: string, message: string): boolean {
  git(dir, ['add', '-A']);
  const scrubbed = scrubStaged(dir);
  if (scrubbed.length > 0) {
    log.info({ dir, files: scrubbed }, '[Workspace] đã xoá dấu ký / dấu AI trước khi commit');
    git(dir, ['add', '--', ...scrubbed]);
  }
  const hasChanges = git(dir, ['status', '--porcelain']).trim().length > 0;
  if (!hasChanges) return false;
  const cleanMessage = scrubCommitMessage(message);
  git(dir, ['commit', '-q', '-m', cleanMessage]);
  log.info({ dir, message: cleanMessage }, '[Workspace] commit');
  return true;
}

/**
 * Lọc dấu trong các file text vừa stage (bỏ qua file nhị phân / quá lớn); trả các file đã sửa.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function scrubStaged(dir: string): string[] {
  const staged = git(dir, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']).split('\0').filter(Boolean);
  return staged.filter((file) => {
    const path = join(dir, file);
    if (statSync(path).size > MAX_SCRUB_BYTES) return false;
    const content = readFileSync(path);
    if (content.includes(0)) return false;
    const text = content.toString('utf8');
    const clean = scrubText(file, text);
    if (clean === text) return false;
    writeFileSync(path, clean);
    return true;
  });
}

/**
 * Chạy git trong [cwd], trả stdout.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * Đường dẫn tương đối có nằm trong danh sách loại trừ của base không.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function isExcluded(path: string, exclude: string[]): boolean {
  return exclude.some((item) => path === item || path.startsWith(`${item}${sep}`));
}
