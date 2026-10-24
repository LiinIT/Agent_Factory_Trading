import { describe, expect, it } from 'vitest';

import { ApiError, apiRequest } from '@/services/api-client';

/**
 * fetch giả trả một phản hồi cố định.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () => new Response(status === 204 ? null : JSON.stringify(body), { status })) as typeof fetch;
}

describe('apiRequest', () => {
  it('trả JSON khi thành công, undefined khi 204', async () => {
    expect(await apiRequest('/x', {}, fakeFetch(200, { id: 'u1' }))).toEqual({ id: 'u1' });
    expect(await apiRequest('/x', {}, fakeFetch(204, null))).toBeUndefined();
  });

  it('lỗi theo định dạng chung của Backend thành ApiError có code / message / details', async () => {
    const error = await apiRequest('/x', {}, fakeFetch(400, { error: { code: 'BAD_REQUEST', message: 'Dữ liệu không hợp lệ', details: ['email'] } })).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'BAD_REQUEST', message: 'Dữ liệu không hợp lệ', details: ['email'] });
  });
});
