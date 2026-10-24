import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type BaseCommands = Record<string, string[]>;

const WILDCARD = '*';

/**
 * Một phần của project (vd `<tên>_app` Flutter, `<tên>_server` Dart Frog, `<tên>_web` Next.js): máy kiểm
 * chạy lệnh của phần trong thư mục của nó. `dir` = tên thư mục hoặc mẫu `*_app` (thư mục gốc kết thúc
 * bằng `_app`); `marker` = file nhận diện phần (không có thì bỏ qua phần); `fallbackDirs` = chỗ tìm
 * khi project cũ đặt tên khác (vd `app/`, hoặc Flutter nằm ngay gốc `.`);
 * `requires[step]` = chuỗi phải có trong `marker` thì mới chạy bước đó (vd codegen cần build_runner).
 */
export type BasePart = {
  name: string;
  dir: string;
  marker: string;
  fallbackDirs?: string[];
  requires?: Record<string, string>;
  commands: BaseCommands;
};

/**
 * Đổi tên khi lập project: thư mục `<from>_app` của base thành `<tiền tố project>_app`…, và thay tên đó
 * trong các file `files` (đường dẫn trong base).
 */
export type BaseRename = { from: string; files: string[] };

export type BaseDefinition = {
  name: string;
  dir: string;
  exclude: string[];
  parts: BasePart[];
  rename?: BaseRename;
};

type RegistryEntry = {
  path: string;
  exclude?: string[];
  parts?: BasePart[];
  commands?: BaseCommands;
  rename?: BaseRename;
};

type RegistryFile = {
  default: string;
  bases: Record<string, RegistryEntry>;
};

const LEGACY_MARKER = 'pubspec.yaml';

/**
 * Đọc base mặc định trong `bases/registry.json`; không có registry thì null. Base kiểu cũ chỉ có
 * `commands` được coi là một phần Flutter ở gốc project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function loadDefaultBase(basesDir: string): BaseDefinition | null {
  const registryPath = join(basesDir, 'registry.json');
  if (!existsSync(registryPath)) return null;
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as RegistryFile;
  const entry = registry.bases[registry.default];
  if (!entry) return null;
  return {
    name: registry.default,
    dir: join(basesDir, entry.path),
    exclude: entry.exclude ?? [],
    parts: entry.parts ?? singlePart(entry.commands ?? {}),
    rename: entry.rename,
  };
}

/**
 * Một phần duy nhất ở gốc project, nhận diện bằng pubspec.yaml (base kiểu cũ, test).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function singlePart(commands: BaseCommands): BasePart[] {
  return [{ name: '', dir: '.', marker: LEGACY_MARKER, requires: { codegen: 'build_runner' }, commands }];
}

/**
 * Thư mục (tương đối) của [part] trong [root]: thư mục khớp `dir` (mẫu `*_x` hoặc tên đúng) có file
 * nhận diện, rồi tới `fallbackDirs`; không có thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
export function resolvePartDir(root: string, part: BasePart): string | null {
  const candidates = [...matchingDirs(root, part.dir), ...(part.fallbackDirs ?? [])];
  return candidates.find((dir) => existsSync(join(root, dir, part.marker))) ?? null;
}

/**
 * Tên thư mục trong [root] khớp [pattern]: `*_app` → mọi thư mục cấp 1 kết thúc bằng `_app`; tên thường → chính nó.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
export function matchingDirs(root: string, pattern: string): string[] {
  if (!pattern.startsWith(WILDCARD)) return [pattern];
  if (!existsSync(root)) return [];
  const suffix = pattern.slice(WILDCARD.length);
  return readdirSync(root)
    .filter((name) => name.endsWith(suffix) && name.length > suffix.length && statSync(join(root, name)).isDirectory())
    .sort();
}

/**
 * Tiền tố thư mục của project từ id (`he-thong-nhan-su` → `he_thong_nhan_su`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-21
 */
export function projectPrefix(projectId: string): string {
  return projectId.replace(/-/g, '_');
}
