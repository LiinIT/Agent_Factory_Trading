import Link from 'next/link';

/**
 * Trang giới thiệu công khai.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export default function HomePage() {
  return (
    <main className="center">
      <section className="card">
        <h1>Chào mừng</h1>
        <p className="muted">Đăng nhập để vào trang thành viên.</p>
        <div className="row">
          <Link className="button primary" href="/login">Đăng nhập</Link>
          <Link className="button" href="/register">Đăng ký</Link>
        </div>
      </section>
    </main>
  );
}
