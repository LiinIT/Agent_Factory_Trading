import { unitLabel } from '@/lib/labels';
import type { Task } from '@/lib/types';

import { RunInstructions } from './run-instructions';

const RESULT_TONES: Record<string, string> = { ĐẠT: 'rich-ok', 'KHÔNG ĐẠT': 'rich-fail', 'CẦN HỎI': 'rich-ask' };
const NONE = 'Không';

/**
 * Việc Chỉ huy trưởng cần làm ngay với nhiệm vụ này, theo trạng thái.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function ownerAction(task: Task): string {
  if (task.status === 'awaiting_answer') return 'Trả lời câu hỏi bên dưới (bấm chọn nhanh).';
  if (task.status === 'awaiting_approval') return 'Duyệt hoặc Trả lại.';
  if (task.status === 'failed') return 'Xem lỗi rồi Thử lại hoặc Bỏ nhiệm vụ.';
  if (task.deniedTools.length > 0) return 'Xét cấp quyền bên dưới.';
  return 'Không cần lệnh.';
}

/**
 * Báo cáo của một ban, phân tầng để đọc nhanh: (1) đọc ngay — kết quả, việc cần làm, đề xuất, cách chạy;
 * (2) tóm tắt — vướng mắc, bằng chứng; (3) chi tiết nhiệm vụ thu gọn. Chưa có báo cáo thì
 * hiện lỗi / nội dung thô như cũ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ReportTiers({ task, projectPath, fallback }: { task: Task; projectPath: string | null; fallback: string }) {
  const report = task.report;
  if (!report) return fallback ? <pre className="block">{fallback}</pre> : null;
  const hasObstacles = report.obstacles.trim() !== '' && report.obstacles.trim() !== NONE;
  const howToRun = report.howToRun?.trim() ?? '';
  const hasRunInstructions = howToRun !== '' && howToRun !== NONE;
  return (
    <div className="report-tiers">
      <div className="tier tier-now">
        <p>
          <span className={`tier-result ${RESULT_TONES[report.result] ?? ''}`}>{report.result}</span>
          <span className="tier-action">{ownerAction(task)}</span>
        </p>
        {task.error ? <p className="rich-fail">Lỗi: {task.error}</p> : null}
        {report.proposal ? <p><span className="tier-label">Đề xuất</span> {report.proposal}</p> : null}
        {hasRunInstructions ? <RunInstructions text={howToRun} projectPath={projectPath} /> : null}
      </div>
      <div className="tier tier-summary">
        {hasObstacles ? <p className="rich-warn"><span className="tier-label">Vướng</span> {report.obstacles}</p> : null}
        <p><span className="tier-label">Bằng chứng</span> {report.evidence}</p>
      </div>
      <details className="tier tier-detail">
        <summary>Chi tiết nhiệm vụ</summary>
        <p><span className="tier-label">Nhiệm vụ</span> {report.mission}</p>
        {task.expected ? <p><span className="tier-label">Yêu cầu</span> {task.expected}</p> : null}
        {task.verification ? <p><span className="tier-label">Cách thử</span> {task.verification}</p> : null}
        <p className="muted">Giao bởi {unitLabel(task.assignedBy)} · {unitLabel(task.role)} · model {task.model ?? 'chưa rõ'}</p>
      </details>
    </div>
  );
}
