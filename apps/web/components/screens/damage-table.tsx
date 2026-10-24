import type { DamageTotals } from '@/lib/types';

const PERCENT = 100;
const TOKENS_PER_K = 1000;
const MS_PER_MINUTE = 60_000;

type DamageTableProps = {
  title: string;
  rows: [string, DamageTotals][];
};

/**
 * Bảng thiệt hại một nhóm: lượt chạy, lỗi, thời gian, quota 5h, token, quy đổi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function DamageTable({ title, rows }: DamageTableProps) {
  return (
    <section className="damage-section">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="muted">Chưa có số liệu.</p>
      ) : (
        <table className="damage-table">
          <thead>
            <tr>
              <th>Đơn vị</th>
              <th>Lượt</th>
              <th>Lỗi</th>
              <th>Phút</th>
              <th>5h</th>
              <th>Token</th>
              <th>≈ USD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, damage]) => (
              <tr key={label}>
                <td className="damage-label">{label}</td>
                <td>{damage.runs}</td>
                <td className={damage.failures > 0 ? 'error' : ''}>{damage.failures}</td>
                <td>{Math.round(damage.durationMs / MS_PER_MINUTE)}</td>
                <td>+{Math.round(damage.fiveHourDelta * PERCENT)}%</td>
                <td>{Math.round((damage.inputTokens + damage.outputTokens) / TOKENS_PER_K)}k</td>
                <td>{damage.costUsd.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
