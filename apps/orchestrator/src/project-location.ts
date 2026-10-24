import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const SYSTEM_DIRS = ['/System', '/usr', '/bin', '/sbin', '/etc', '/private', '/Library', '/Applications', '/opt', '/var', '/tmp'];
const GIT_REMOTE =
  /^(?:https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[\w./-]+|git@[A-Za-z0-9.-]+:[\w./-]+|ssh:\/\/git@[A-Za-z0-9.-]+(?::\d+)?\/[\w./-]+)$/;

export type LocationRules = {
  home: string;
  factoryRoot: string;
  blockedDirs?: string[];
};

/**
 * [child] có nằm trong (hoặc trùng) [parent] không.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function isInside(child: string, parent: string): boolean {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

/**
 * Đổi nơi lưu Chỉ huy trưởng nhập (tuyệt đối hoặc `~/…`) thành đường dẫn tuyệt đối an toàn:
 * không phải thư mục hệ thống / thư mục nhà / trong repo agent-factory, thư mục cha phải có
 * sẵn, thư mục đích chưa có hoặc đang trống. Sai thì ném lỗi tiếng Việt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function resolveProjectDir(input: string, rules: LocationRules): string {
  const raw = input.trim();
  const expanded = raw === '~' || raw.startsWith('~/') ? join(rules.home, raw.slice(1)) : raw;
  if (!isAbsolute(expanded)) throw new Error('Nơi lưu phải là đường dẫn tuyệt đối hoặc bắt đầu bằng ~/');
  const dir = resolve(expanded);
  if (dir === rules.home || dir === '/' || (rules.blockedDirs ?? SYSTEM_DIRS).some((system) => isInside(dir, system))) {
    throw new Error(`Không lưu project vào ${dir} — chọn một thư mục con, vd ~/Documents/StudioMia_workspace/<tên app>`);
  }
  if (isInside(dir, rules.factoryRoot)) throw new Error('Không lưu project trong repo agent-factory — để trống để dùng nơi lưu mặc định.');
  const parent = dirname(dir);
  if (!existsSync(parent) || !statSync(parent).isDirectory()) throw new Error(`Thư mục cha ${parent} chưa có — tạo trước rồi chọn lại.`);
  if (existsSync(dir) && (!statSync(dir).isDirectory() || readdirSync(dir).length > 0)) {
    throw new Error(`${dir} đã có dữ liệu — chọn thư mục mới hoặc thư mục trống.`);
  }
  return dir;
}

/**
 * Kiểm URL git remote: chỉ https/ssh dạng chuẩn, không kèm tài khoản/mật khẩu/token trong URL.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function validateGitRemote(input: string): string {
  const url = input.trim();
  if (/^https?:\/\/[^/]*@/.test(url)) throw new Error('Không ghi tài khoản/token vào URL — dùng SSH key hoặc trình quản lý mật khẩu của git.');
  if (!GIT_REMOTE.test(url)) throw new Error('URL git không hợp lệ — dạng https://github.com/<chủ>/<repo>.git hoặc git@github.com:<chủ>/<repo>.git');
  return url;
}
