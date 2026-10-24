'use client';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { useAsyncData } from '@/hooks/use-async-data';
import { fetchUsers } from '@/services/users-service';
import { useState } from 'react';

const PAGE_SIZE = 20;

/**
 * Bảng người dùng cho admin, có phân trang; đủ trạng thái đang tải / lỗi / rỗng.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function MembersTable() {
  const [page, setPage] = useState(1);
  const { isLoading, error, data, reload } = useAsyncData(() => fetchUsers(page, PAGE_SIZE), [page]);
  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  if (!data || data.items.length === 0) return <EmptyView message="Chưa có người dùng." />;
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr><th>Email</th><th>Tên</th><th>Vai</th><th>Ngày tạo</th></tr>
        </thead>
        <tbody>
          {data.items.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name ?? '—'}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager">
        <button className="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
        <span className="muted">Trang {page}/{pageCount} · {data.total} người dùng</span>
        <button className="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Sau</button>
      </div>
    </div>
  );
}
