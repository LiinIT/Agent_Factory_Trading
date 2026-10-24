'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { unitLabel } from '@/lib/labels';
import type { DamageReport, DamageTotals, FactoryState } from '@/lib/types';

import { DamageTable } from './damage-table';

const TOP_TASKS = 10;

type DamageScreenProps = {
  state: FactoryState;
};

/**
 * Báo cáo thiệt hại của Ban Hậu cần: hôm nay, theo ban, theo project, theo ngày,
 * và 10 nhiệm vụ tốn nhất. Số liệu thật từ từng lần chạy agent.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function DamageScreen({ state }: DamageScreenProps) {
  const [report, setReport] = useState<DamageReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const runCount = state.damage.today.runs;

  useEffect(() => {
    let active = true;
    api
      .damage()
      .then((data) => active && setReport(data))
      .catch((error: unknown) => active && setLoadError(String(error)));
    return () => {
      active = false;
    };
  }, [runCount]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!report) return <p className="muted">$ đang tổng hợp…</p>;
  const taskTitle = (taskId: string) => state.tasks.find((task) => String(task.id) === taskId)?.title ?? '';
  const topTasks: [string, DamageTotals][] = Object.entries(report.byTask)
    .toSorted(([, first], [, second]) => second.inputTokens - first.inputTokens)
    .slice(0, TOP_TASKS)
    .map(([taskId, damage]) => [`#${taskId} ${taskTitle(taskId)}`, damage]);
  return (
    <div className="damage">
      <DamageTable title="Hôm nay" rows={[['Toàn đơn vị', report.today]]} />
      <DamageTable title="Theo ban" rows={Object.entries(report.byRole).map(([role, damage]) => [unitLabel(role), damage])} />
      <DamageTable title="Theo project" rows={Object.entries(report.byProject)} />
      <DamageTable title="Theo ngày" rows={Object.entries(report.byDay).toSorted(([a], [b]) => b.localeCompare(a))} />
      <DamageTable title="Nhiệm vụ tốn nhất" rows={topTasks} />
      <p className="muted small">
        Quy đổi theo giá API tham khảo — gói đăng ký không bị trừ tiền. % quota đo bằng chênh lệch trước/sau mỗi lần chạy nên có sai số khi Claude cập nhật quota theo đợt.
      </p>
    </div>
  );
}
