'use client';

import { useState } from 'react';

import type { FactoryState } from '@/lib/types';

import { SandboxFrame } from './sandbox-frame';

type BotReportScreenProps = {
  state: FactoryState;
};

/**
 * Xem báo cáo HTML của Ban Báo cáo (hồ sơ điểm mạnh/yếu từng bot) trong khung cách ly:
 * chọn project và báo cáo, mặc định báo cáo mới nhất.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
export function BotReportScreen({ state }: BotReportScreenProps) {
  const projects = state.projects.filter((project) => project.reports.length > 0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reportName, setReportName] = useState<string | null>(null);
  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  if (!project) return <p className="muted">Chưa có báo cáo. Ban Báo cáo sẽ lập sau khi Hội đồng Nghiệm thu kết luận một bot.</p>;
  const current = project.reports.includes(reportName ?? '') ? (reportName ?? '') : (project.reports[0] ?? '');
  return (
    <div className="sandbox">
      <div className="sandbox-bar">
        <select
          value={project.id}
          onChange={(event) => {
            setProjectId(event.target.value);
            setReportName(null);
          }}
          aria-label="Chọn project"
        >
          {projects.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select value={current} onChange={(event) => setReportName(event.target.value)} aria-label="Chọn báo cáo">
          {project.reports.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <SandboxFrame key={`${project.id}:${current}`} src={`/api/projects/${project.id}/reports/${encodeURIComponent(current)}`} width={null} height={null} />
    </div>
  );
}
