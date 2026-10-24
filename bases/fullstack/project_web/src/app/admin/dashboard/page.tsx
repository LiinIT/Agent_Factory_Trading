import Link from 'next/link';

/**
 * Trang tổng quan quản trị.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function AdminDashboardPage() {
  return (
    <>
      <h1>Quản trị</h1>
      <p className="muted">Chọn mục cần quản lý.</p>
      <Link className="button" href="/admin/members">Người dùng</Link>
    </>
  );
}
