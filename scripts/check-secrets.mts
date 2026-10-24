import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import {
  ALLOW_MARKER,
  describeFinding,
  forbiddenPathReason,
  scanSecrets,
  type SecretFinding,
} from '../apps/orchestrator/src/secret-scan.ts';

const TOKEN_FILE = 'data/token';
const MIN_TOKEN_LENGTH = 16;
const GIT_MAX_BUFFER = 64 * 1024 * 1024;

/**
 * Chạy git và trả stdout (Buffer để đọc được cả file nhị phân).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function git(args: string[]): Buffer {
  return execFileSync('git', args, { maxBuffer: GIT_MAX_BUFFER });
}

/**
 * Danh sách file cần quét: đã stage (mặc định) hoặc mọi file sẽ vào repo (`--all`).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function filesToScan(scanAll: boolean): string[] {
  const args = scanAll
    ? ['ls-files', '-z', '--cached', '--others', '--exclude-standard']
    : ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'];
  return git(args).toString('utf8').split('\0').filter(Boolean);
}

/**
 * Nội dung sẽ được commit: bản đã stage, hoặc file trên đĩa khi quét `--all`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function contentOf(file: string, scanAll: boolean): Buffer | null {
  try {
    return scanAll ? readFileSync(file) : git(['show', `:${file}`]);
  } catch {
    return null;
  }
}

/**
 * Token orchestrator thật trên máy (nếu có) — không được xuất hiện trong bất kỳ file nào.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function localToken(): string | null {
  if (!existsSync(TOKEN_FILE)) return null;
  const token = readFileSync(TOKEN_FILE, 'utf8').trim();
  return token.length >= MIN_TOKEN_LENGTH ? token : null;
}

/**
 * Quét một file: đường dẫn cấm và nội dung (bỏ qua file nhị phân).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function scanFile(file: string, scanAll: boolean, token: string | null): SecretFinding[] {
  const forbidden = forbiddenPathReason(file);
  if (forbidden) return [{ file, line: null, kind: `file cấm commit: ${forbidden}`, preview: '' }];
  const content = contentOf(file, scanAll);
  if (!content || content.includes(0)) return [];
  return scanSecrets(file, content.toString('utf8'), token ? { kind: 'token orchestrator thật (data/token)', value: token } : null);
}

/**
 * Điểm vào: quét, in kết quả đã che giá trị, thoát mã 1 nếu có bí mật để chặn commit.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function main(): void {
  const scanAll = process.argv.includes('--all');
  const token = localToken();
  const files = filesToScan(scanAll);
  const findings = files.flatMap((file) => scanFile(file, scanAll, token));
  if (findings.length === 0) {
    process.stdout.write(`[check-secrets] sạch — đã quét ${files.length} file\n`);
    return;
  }
  process.stderr.write(`[check-secrets] CHẶN: tìm thấy ${findings.length} bí mật — nghiêm cấm commit\n`);
  for (const finding of findings) process.stderr.write(`  ${describeFinding(finding)}\n`);
  process.stderr.write('Gỡ khỏi stage: git restore --staged <file>. Khoá thật để trong Keychain (màn Env).\n');
  process.stderr.write(`Nếu chắc chắn là giá trị giả: thêm "${ALLOW_MARKER}" vào cuối dòng đó.\n`);
  process.exitCode = 1;
}

main();
