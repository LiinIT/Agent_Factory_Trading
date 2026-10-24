/**
 * Trạng thái đang tải dùng chung.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function LoadingView() {
  return <p className="muted" role="status">Đang tải…</p>;
}

/**
 * Trạng thái lỗi dùng chung, có nút thử lại.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function ErrorView({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="error-box" role="alert">
      <p>{error.message}</p>
      <button className="button" onClick={onRetry}>Thử lại</button>
    </div>
  );
}

/**
 * Trạng thái rỗng dùng chung.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function EmptyView({ message }: { message: string }) {
  return <p className="muted">{message}</p>;
}
