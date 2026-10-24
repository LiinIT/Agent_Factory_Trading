import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? 'http://127.0.0.1:7400';
const TOKEN_FILE = process.env.FACTORY_TOKEN_FILE ?? resolve(process.cwd(), '../../data/token');

type RouteContext = { params: Promise<{ path: string[] }> };

const FORWARDED_HEADERS = ['content-security-policy', 'x-content-type-options', 'referrer-policy'];

/**
 * Đọc token API của orchestrator (đọc lại mỗi lần để hợp lệ cả khi token đổi).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function readToken(): string {
  return readFileSync(TOKEN_FILE, 'utf8').trim();
}

/**
 * Chuyển request của trình duyệt tới orchestrator kèm token — token không bao
 * giờ xuống trình duyệt. Hỗ trợ luồng SSE.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const target = `${ORCHESTRATOR_URL}/api/${path.map(encodeURIComponent).join('/')}`;
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: { 'content-type': 'application/json', 'x-factory-token': readToken() },
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
      signal: request.signal,
      cache: 'no-store',
    });
    const headers = new Headers({ 'content-type': upstream.headers.get('content-type') ?? 'application/json', 'cache-control': 'no-cache' });
    for (const name of FORWARDED_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return Response.json(
      { error: `Không kết nối được orchestrator (${ORCHESTRATOR_URL}): ${String(error)}` },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
