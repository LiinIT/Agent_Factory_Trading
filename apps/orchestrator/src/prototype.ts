import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';

export const PROTOTYPE_DIR = 'design/prototype';
const FALLBACK_DIR = 'design';
const ENTRY_FILE = 'index.html';
const LINK_TAG = /<link\b[^>]*>/gi;
const STYLESHEET_REL = /\brel=["']?stylesheet/i;
const LOCAL_HREF = /\bhref=["']([^"':]+)["']/i;
const LOCAL_SCRIPT = /<script\b([^>]*?)\s+src=["']([^"':]+)["']([^>]*)>\s*<\/script>/gi;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const SANDBOX_POLICY = [
  'sandbox allow-scripts allow-forms',
  "default-src 'self' 'unsafe-inline' data: blob:",
  "connect-src 'none'",
  "frame-ancestors 'self'",
].join('; ');

/**
 * Thư mục GUI demo của project: `design/prototype/` (đúng quy định), không có thì `design/`
 * (ban ghi lệch chỗ); chưa có `index.html` ở đâu cả thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function prototypeRoot(projectDir: string): string | null {
  return [PROTOTYPE_DIR, FALLBACK_DIR].map((dir) => resolve(projectDir, dir)).find((dir) => existsSync(join(dir, ENTRY_FILE))) ?? null;
}

/**
 * Phục vụ một file GUI demo (do Ban Ngoại giao viết) trong chế độ cách ly:
 * chặn thoát khỏi thư mục (kể cả qua symlink), CSP `sandbox` để trang chạy ở
 * origin rỗng — không đọc được token, không gọi được API, không gọi mạng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function servePrototype(response: ServerResponse, projectDir: string, subPath: string): void {
  const root = prototypeRoot(projectDir);
  if (!root) return notFound(response, 'Chưa có GUI demo');
  const relative = subPath.replace(/^\/+/, '') || ENTRY_FILE;
  let target = resolve(root, relative);
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, ENTRY_FILE);
  if (!existsSync(target)) return notFound(response, 'Không có file');
  const realRoot = realpathSync(root);
  const realTarget = insideRoot(realRoot, target);
  if (!realTarget) return notFound(response, 'Ngoài phạm vi GUI demo');
  const extension = extname(realTarget).toLowerCase();
  const body = extension === '.html' ? inlineLocalAssets(readFileSync(realTarget, 'utf8'), dirname(realTarget), realRoot) : readFileSync(realTarget);
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
    'content-security-policy': SANDBOX_POLICY,
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
  });
  response.end(body);
}

/**
 * Đường dẫn thật của [path] nếu nằm trong GUI demo (kể cả qua symlink), không thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function insideRoot(realRoot: string, path: string): string | null {
  if (!existsSync(path)) return null;
  const real = realpathSync(path);
  return real === realRoot || real.startsWith(`${realRoot}${sep}`) ? real : null;
}

/**
 * Nhúng thẳng CSS / JS cục bộ (`<link rel="stylesheet" href>`, `<script src>`) vào trang HTML:
 * trang chạy ở origin rỗng (CSP sandbox) nên tải file con dễ bị trình duyệt / tiện ích chặn.
 * Chỉ nhúng file nằm trong thư mục GUI demo; tag khác (link mạng, file ngoài phạm vi) giữ nguyên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function inlineLocalAssets(html: string, baseDir: string, realRoot: string): string {
  const read = (relativePath: string): string | null => {
    const path = insideRoot(realRoot, resolve(baseDir, relativePath));
    return path && statSync(path).isFile() ? readFileSync(path, 'utf8') : null;
  };
  const withStyles = html.replace(LINK_TAG, (tag) => {
    const href = LOCAL_HREF.exec(tag)?.[1];
    const css = STYLESHEET_REL.test(tag) && href ? read(href) : null;
    return css === null ? tag : `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`;
  });
  return withStyles.replace(LOCAL_SCRIPT, (tag, before: string, src: string, after: string) => {
    const js = read(src);
    return js === null ? tag : `<script${before}${after}>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  });
}

/**
 * Trả 404 dạng văn bản.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function notFound(response: ServerResponse, message: string): void {
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}
