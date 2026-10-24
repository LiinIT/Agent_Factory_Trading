'use client';

import { ErrorView, LoadingView } from '@/components/state-views';
import { useAsyncData } from '@/hooks/use-async-data';
import { fetchMe } from '@/services/users-service';

/**
 * Thẻ hồ sơ người đang đăng nhập (lấy từ server), đủ trạng thái đang tải / lỗi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function ProfileCard() {
  const { isLoading, error, data, reload } = useAsyncData(fetchMe, []);
  if (isLoading) return <LoadingView />;
  if (error || !data) return <ErrorView error={error ?? new Error('Không tải được hồ sơ')} onRetry={reload} />;
  return (
    <dl className="card profile">
      <dt>Email</dt><dd>{data.email}</dd>
      <dt>Tên</dt><dd>{data.name ?? '—'}</dd>
      <dt>Vai</dt><dd>{data.role}</dd>
      <dt>Tham gia</dt><dd>{new Date(data.createdAt).toLocaleDateString('vi-VN')}</dd>
    </dl>
  );
}
