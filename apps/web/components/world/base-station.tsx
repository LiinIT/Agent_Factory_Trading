import { iso, type GridPoint } from '@/lib/iso';
import { focusTaskOf, shortModel, truncate, type NodeState, type RoleActivity } from '@/lib/org';
import { roleIcon } from '@/lib/role-icons';
import { formatElapsed } from '@/lib/use-now';

import { BuildingFor } from './buildings';

const BADGE_RADIUS = 13;
const BADGE_ICON = 15;
const BADGE_Z = 2.45;
const TEXT_MAX = 26;

type BaseStationProps = {
  activity: RoleActivity;
  center: GridPoint;
  state: NodeState;
  now: number;
  onOpen: () => void;
};

/**
 * Một ban trong căn cứ: công trình riêng của ban, huy hiệu icon nổi phía trên, nhãn
 * trạng thái; tooltip ghi chức năng. Đang làm thì công trình sáng và có hoạt động.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function BaseStation({ activity, center, state, now, onOpen }: BaseStationProps) {
  const Icon = roleIcon(activity.role.name);
  const badge = iso({ ...center, z: BADGE_Z });
  const focusTask = focusTaskOf(activity);
  return (
    <g
      className={`world-object station is-${state} role-${activity.role.name}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={`${activity.role.unit} — ${focusTask ? focusTask.title : 'sẵn sàng'}`}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen()}
    >
      <title>{`${activity.role.unit} — ${activity.role.duty}`}</title>
      <BuildingFor role={activity.role.name} center={center} />
      <circle className="badge-halo" cx={badge.x} cy={badge.y} r={BADGE_RADIUS + 6} />
      <circle className="badge-ring" cx={badge.x} cy={badge.y} r={BADGE_RADIUS} />
      <Icon className="badge-icon" x={badge.x - BADGE_ICON / 2} y={badge.y - BADGE_ICON / 2} width={BADGE_ICON} height={BADGE_ICON} strokeWidth={1.8} />
      <text className="world-label" x={badge.x} y={badge.y - 62} textAnchor="middle">{activity.role.unit}</text>
      <text className="world-sublabel" x={badge.x} y={badge.y - 48} textAnchor="middle">
        {statusText(state, activity, now)}
        {state === 'working' ? ` · ${shortModel(activity.running?.model ?? null, activity.role.model)}` : ''}
      </text>
      {focusTask ? (
        <text className="world-task" x={badge.x} y={badge.y - 34} textAnchor="middle">
          {truncate(`#${focusTask.id} ${focusTask.title}`, TEXT_MAX)}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Dòng trạng thái ngắn của ban.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function statusText(state: NodeState, activity: RoleActivity, now: number): string {
  if (state === 'working') return `> đang làm · ${formatElapsed(activity.running?.startedAt ?? null, now)}`;
  if (state === 'asking') return `> xin ý kiến (${activity.asking.length})`;
  if (state === 'waiting') return `> chờ duyệt (${activity.waiting.length})`;
  if (state === 'blocked') return `> lỗi / bị chặn (${activity.blocked})`;
  return `> sẵn sàng · chờ ${activity.queued}`;
}
