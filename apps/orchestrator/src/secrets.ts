import { execFile } from 'node:child_process';

import { log } from './logger.ts';

const KEYCHAIN_SERVICE = 'agent-factory';
const HINT_LENGTH = 4;
const SECRET_NAME = /^[A-Z][A-Z0-9_]{2,63}$/;

export type SecretStore = {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
};

/**
 * Chạy lệnh `security` của macOS, trả stdout (lỗi → null).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function security(args: string[]): Promise<string | null> {
  return new Promise((resolvePromise) => {
    execFile('security', args, (error, stdout) => resolvePromise(error ? null : stdout));
  });
}

/**
 * Tên khoá hợp lệ (vd `OPENAI_API_KEY`) — chặn tiêm tham số vào lệnh security.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function assertSecretName(name: string): void {
  if (!SECRET_NAME.test(name)) throw new Error(`Tên khoá không hợp lệ: ${name}`);
}

/**
 * Kho khoá dùng Keychain của macOS (mã hoá, nằm ngoài thư mục project).
 * Giá trị chỉ được ghi vào và đọc ra ở orchestrator — không bao giờ gửi xuống web.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export const keychainStore: SecretStore = {
  async get(name) {
    assertSecretName(name);
    const value = await security(['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', name, '-w']);
    return value === null ? null : value.trim();
  },
  async set(name, value) {
    assertSecretName(name);
    const result = await security(['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE, '-a', name, '-w', value]);
    if (result === null) throw new Error(`Không lưu được ${name} vào Keychain`);
    log.info({ name }, '[Secrets] lưu khoá');
  },
  async remove(name) {
    assertSecretName(name);
    await security(['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', name]);
    log.info({ name }, '[Secrets] xoá khoá');
  },
};

/**
 * Kho khoá trong RAM (dùng cho test).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function memoryStore(initial: Record<string, string> = {}): SecretStore {
  const values = new Map(Object.entries(initial));
  return {
    async get(name) {
      return values.get(name) ?? null;
    },
    async set(name, value) {
      assertSecretName(name);
      values.set(name, value);
    },
    async remove(name) {
      values.delete(name);
    },
  };
}

/**
 * Gợi ý an toàn để hiển thị: chỉ 4 ký tự cuối.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function secretHint(value: string | null): string | null {
  return value ? `••••${value.slice(-HINT_LENGTH)}` : null;
}
