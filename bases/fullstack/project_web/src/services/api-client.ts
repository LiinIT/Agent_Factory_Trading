export type ApiErrorBody = { error?: { code?: string; message?: string; details?: unknown } };

/**
 * Lỗi API theo định dạng chung của server `{ error: { code, message, details } }`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  /**
   * Tạo lỗi từ mã HTTP và thân phản hồi lỗi.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-20
   */
  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? `Lỗi ${status}`);
    this.status = status;
    this.code = body.error?.code ?? `HTTP_${status}`;
    this.details = body.error?.details;
  }
}

/**
 * Gọi API (qua proxy cùng origin của web) và trả JSON; lỗi HTTP ném ApiError.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export async function apiRequest<T>(url: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(url, { ...init, headers: { 'content-type': 'application/json', ...init.headers }, cache: 'no-store' });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) throw new ApiError(response.status, body as ApiErrorBody);
  return body as T;
}
