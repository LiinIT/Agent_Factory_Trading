import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type FileSnapshot = Map<string, string>;

const DELETED = 'deleted';
const GLOBAL_BRAIN_PREFIX = 'brain/ea/';
const PROJECT_BRAIN_ALIAS = 'brain-ea/';
const OUTSIDE_PREFIX = 'ngoài-project/';

/**
 * Danh sách file đang khác HEAD hoặc chưa theo dõi trong một repo git, kèm mã băm nội dung
 * (file bị xóa ghi là `deleted`). Thư mục không phải repo thì rỗng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function snapshotRepo(dir: string): FileSnapshot {
  const snapshot: FileSnapshot = new Map();
  if (!existsSync(join(dir, '.git'))) return snapshot;
  const listed = execFileSync('git', ['ls-files', '-m', '-o', '-d', '--exclude-standard', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  for (const path of listed.split('\0').filter(Boolean)) {
    const full = join(dir, path);
    const isFile = existsSync(full) && statSync(full).isFile();
    snapshot.set(path, isFile ? createHash('sha1').update(readFileSync(full)).digest('hex') : DELETED);
  }
  return snapshot;
}

/**
 * Ảnh chụp thay đổi của một lượt chạy: project (đường dẫn gốc project) và bộ não chung của DV2
 * (`brain/ea/…` hiện trong project là `brain-ea/…`; thay đổi ở nơi khác trong repo DV2 gắn nhãn "ngoài-project/").
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function snapshotRun(projectDir: string, factoryRoot: string): FileSnapshot {
  const merged = snapshotRepo(projectDir);
  for (const [path, hash] of snapshotRepo(factoryRoot)) {
    const alias = path.startsWith(GLOBAL_BRAIN_PREFIX) ? `${PROJECT_BRAIN_ALIAS}${path.slice(GLOBAL_BRAIN_PREFIX.length)}` : `${OUTSIDE_PREFIX}${path}`;
    merged.set(alias, hash);
  }
  return merged;
}

/**
 * File khác nhau giữa hai ảnh chụp (mới, sửa, xóa).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function changedBetween(before: FileSnapshot, after: FileSnapshot): string[] {
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths].filter((path) => before.get(path) !== after.get(path)).sort();
}

/**
 * File bị đổi nằm ngoài vùng ban được phép ghi (`writes` trong team/*.md, tiền tố đường dẫn).
 * `writes` rỗng nghĩa là không áp quy tắc.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function scopeViolations(changed: string[], writes: string[]): string[] {
  if (writes.length === 0) return [];
  return changed.filter((path) => !writes.some((prefix) => path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || path === prefix.replace(/\/$/, '')));
}
