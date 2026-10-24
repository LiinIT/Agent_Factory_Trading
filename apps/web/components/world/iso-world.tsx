'use client';

import { Package, RadioTower, ShieldCheck } from 'lucide-react';

import { fromScreen, iso, type GridPoint } from '@/lib/iso';
import { focusTaskOf, nodeState, roleActivities, type RoleActivity } from '@/lib/org';
import type { LiveLog } from '@/lib/use-factory';
import { useNow } from '@/lib/use-now';
import type { FactoryState } from '@/lib/types';

import { BaseStation } from './base-station';
import { DataPipe, type PipeState } from './data-pipe';
import { HqTower } from './hq-tower';
import { SupportPost } from './support-post';
import { WorldDefs } from './world-defs';
import { ZonePad } from './zone-pad';

const HQ: GridPoint = { x: 0, y: 0 };
const VIEW_BOX = '-470 -290 940 730';
const CLOCK_INTERVAL_MS = 1000;
const REPORT_FLASH_MS = 15_000;
const PIPE_Z = 0.12;
const PIPE_START_GAP = 1.7;
const PIPE_END_GAP = 0.95;
const PIPE_SAG = 26;

const RING = { centerY: 40, radiusX: 330, radiusY: 195 };
const POST_ROW_Y = 372;
const POST_SPACING = 120;
const STATION_PAD = 2.5;
const POST_PAD = 1.5;
const ZONE_LABEL_DROP = 78;
const SAME_ROW_TOLERANCE = 30;
const DEGREES = Math.PI / 180;

/** Góc (độ, trục y hướng xuống) của từng ban trên vòng elip quanh tháp, xếp theo khối. */
const STATION_ANGLES: Record<string, number> = {
  'tac-chien': 213,
  'ngoai-giao': 163,
  'cong-binh': 327,
  'xung-kich': 17,
  'kiem-soat': 60,
  'nghiem-thu': 120,
};

const ZONES = [
  { key: 'tac-chien', label: 'KHỐI TÁC CHIẾN', roles: ['tac-chien', 'ngoai-giao'] },
  { key: 'ky-thuat', label: 'KHỐI KỸ THUẬT', roles: ['cong-binh', 'xung-kich'] },
  { key: 'kiem-soat', label: 'KHỐI KIỂM SOÁT', roles: ['kiem-soat', 'nghiem-thu'] },
];

/**
 * Vị trí lưới của một ban: điểm trên vòng elip màn hình tại góc của ban.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function stationCenter(role: string): GridPoint | null {
  const angle = STATION_ANGLES[role];
  if (angle === undefined) return null;
  return fromScreen({
    x: Math.cos(angle * DEGREES) * RING.radiusX,
    y: RING.centerY + Math.sin(angle * DEGREES) * RING.radiusY,
  });
}

/**
 * Vị trí nhãn khu: hai ban cùng hàng thì đặt giữa hai ban, lệch hàng thì đặt dưới chân ban thấp hơn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function zoneLabelPoint(points: GridPoint[]): { x: number; y: number } | null {
  if (points.length === 0) return null;
  const screens = points.map((point) => iso(point));
  const lowestY = Math.max(...screens.map((point) => point.y));
  const highestY = Math.min(...screens.map((point) => point.y));
  const midX = screens.reduce((sum, point) => sum + point.x, 0) / screens.length;
  if (lowestY - highestY < SAME_ROW_TOLERANCE) return { x: midX, y: lowestY };
  const lowest = screens.find((point) => point.y === lowestY) ?? screens[0];
  return { x: lowest.x, y: lowestY + ZONE_LABEL_DROP };
}

const POSTS = {
  thongTin: fromScreen({ x: -POST_SPACING, y: POST_ROW_Y }),
  hauCan: fromScreen({ x: 0, y: POST_ROW_Y }),
  baoMat: fromScreen({ x: POST_SPACING, y: POST_ROW_Y }),
};

type IsoWorldProps = {
  state: FactoryState;
  liveLogs: LiveLog[];
  onOpenManager: () => void;
  onOpenSystem: () => void;
  onOpenDamage: () => void;
  onOpenApprovals: () => void;
  onSelectTask: (taskId: number) => void;
};

/**
 * Căn cứ dã chiến: tháp Sở chỉ huy (Brain) ở giữa, 4 khu quanh tháp; mỗi ban một công
 * trình riêng nối với tháp bằng cáp sáng — drone bay xuôi khi giao lệnh, bay ngược khi
 * ban vừa báo cáo. Khối Bảo đảm (Thông tin, Hậu cần, Bảo mật) là máy tự chạy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function IsoWorld(props: IsoWorldProps) {
  const { state, onOpenManager, onOpenSystem, onOpenDamage, onOpenApprovals, onSelectTask } = props;
  const now = useNow(CLOCK_INTERVAL_MS);
  const activities = roleActivities(state);
  const queued = state.tasks.filter((task) => task.status === 'queued').length;
  const isPaused = state.pause.manual || state.pause.until !== null;
  const blockedCount = state.tasks.filter((task) => task.deniedTools.length > 0).length;
  const stations = activities.flatMap((activity) => {
    const center = stationCenter(activity.role.name);
    return center ? [{ activity, center, state: nodeState(activity), pipe: pipeState(activity, now) }] : [];
  });
  const centers = new Map(stations.map((station) => [station.activity.role.name, station.center]));
  const workingRoles = new Set(stations.filter((station) => station.state === 'working').map((station) => station.activity.role.name));
  const zoneLabels = ZONES.flatMap((zone) => {
    const point = zoneLabelPoint(zone.roles.flatMap((role) => centers.get(role) ?? []));
    return point ? [{ ...zone, point, isActive: zone.roles.some((role) => workingRoles.has(role)) }] : [];
  });
  const postLabel = iso({ x: POSTS.hauCan.x, y: POSTS.hauCan.y });
  const stationsByDepth = stations.toSorted((first, second) => first.center.x + first.center.y - (second.center.x + second.center.y));

  return (
    <div className="world" aria-label="Căn cứ dã chiến">
      <svg className="world-svg" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" role="img">
        <WorldDefs />
        <rect className="hex-floor" x={-470} y={-290} width={940} height={730} />
        {stations.map((station) => (
          <ZonePad key={station.activity.role.name} center={station.center} size={STATION_PAD} isActive={station.state === 'working'} />
        ))}
        {Object.entries(POSTS).map(([key, center]) => (
          <ZonePad key={key} center={center} size={POST_PAD} isActive={false} />
        ))}
        {stations.map((station) => (
          <DataPipe key={station.activity.role.name} path={cablePath(station.center)} state={station.pipe} />
        ))}
        <DataPipe path={cablePath(POSTS.hauCan)} state={queued > 0 && !isPaused ? 'working' : 'idle'} />
        <HqTower center={HQ} isThinking={state.managerBusy} queued={queued} onOpen={onOpenManager} />
        <SupportPost
          center={POSTS.thongTin}
          icon={RadioTower}
          label="ban-thong-tin"
          status={isPaused ? '> tạm dừng' : `> hàng đợi ${queued}`}
          isAlert={isPaused}
          onOpen={onOpenSystem}
        />
        <SupportPost
          center={POSTS.hauCan}
          icon={Package}
          label="ban-hau-can"
          status={`> ≈$${state.damage.today.costUsd.toFixed(2)} · ${state.damage.today.runs} lượt`}
          isAlert={state.damage.today.failures > 0}
          onOpen={onOpenDamage}
        />
        <SupportPost
          center={POSTS.baoMat}
          icon={ShieldCheck}
          label="ban-bao-mat"
          status={blockedCount > 0 ? `> ${blockedCount} bị chặn` : '> an toàn'}
          isAlert={blockedCount > 0}
          onOpen={onOpenApprovals}
        />
        {stationsByDepth.map((station) => {
          const focusTask = focusTaskOf(station.activity);
          return (
            <BaseStation
              key={station.activity.role.name}
              activity={station.activity}
              center={station.center}
              state={station.state}
              now={now}
              onOpen={() => (focusTask ? onSelectTask(focusTask.id) : onOpenSystem())}
            />
          );
        })}
        {zoneLabels.map((zone) => (
          <text key={zone.key} className={`zone-label ${zone.isActive ? 'is-active' : ''}`} x={zone.point.x} y={zone.point.y} textAnchor="middle">
            {zone.label}
          </text>
        ))}
        <text className="zone-label" x={postLabel.x} y={postLabel.y + 52} textAnchor="middle">KHỐI BẢO ĐẢM · máy tự chạy</text>
      </svg>
    </div>
  );
}

/**
 * Trạng thái cáp tới một ban: đang làm > vừa báo cáo (15 giây) > hỏi > chờ duyệt > chặn > rảnh.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
function pipeState(activity: RoleActivity, now: number): PipeState {
  const visual = nodeState(activity);
  if (visual === 'working') return 'working';
  const finishedAt = activity.lastFinished?.finishedAt;
  if (finishedAt && now - Date.parse(finishedAt) < REPORT_FLASH_MS) return 'reporting';
  return visual;
}

/**
 * Cáp cong từ chân tháp Sở chỉ huy tới chân công trình (võng nhẹ xuống như cáp thật).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function cablePath(target: GridPoint): string {
  const length = Math.hypot(target.x - HQ.x, target.y - HQ.y);
  const unitX = (target.x - HQ.x) / length;
  const unitY = (target.y - HQ.y) / length;
  const start = iso({ x: HQ.x + unitX * PIPE_START_GAP, y: HQ.y + unitY * PIPE_START_GAP, z: PIPE_Z });
  const end = iso({ x: target.x - unitX * PIPE_END_GAP, y: target.y - unitY * PIPE_END_GAP, z: PIPE_Z });
  const control = (ratio: number) => ({
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio + PIPE_SAG,
  });
  const first = control(1 / 3);
  const second = control(2 / 3);
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${first.x.toFixed(1)} ${first.y.toFixed(1)}, ${second.x.toFixed(1)} ${second.y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}
