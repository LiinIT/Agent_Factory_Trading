'use client';

import { Globe, type LucideIcon, Maximize, Smartphone, TabletSmartphone } from 'lucide-react';
import { useState } from 'react';

import type { FactoryState } from '@/lib/types';

import { TaskActions } from '../task-actions';
import { SandboxFrame } from './sandbox-frame';

type DeviceFrame = { id: string; label: string; icon: LucideIcon; width: number | null; height: number | null };

const DEVICES: DeviceFrame[] = [
  { id: 'fit', label: 'Vừa khung', icon: Maximize, width: null, height: null },
  { id: 'iphone', label: 'iPhone 393', icon: Smartphone, width: 393, height: 852 },
  { id: 'android', label: 'Android 412', icon: TabletSmartphone, width: 412, height: 915 },
  { id: 'web', label: 'Web 1280', icon: Globe, width: 1280, height: 800 },
];

type SandboxScreenProps = {
  state: FactoryState;
  onChanged: () => void;
};

/**
 * Xem GUI demo của Ban Ngoại giao trong khung cách ly — luôn thấy trọn máy ("Vừa khung" hoặc cỡ máy thu nhỏ cho vừa),
 * kèm nút duyệt / trả lại khi GUI demo đang chờ Chỉ huy trưởng duyệt.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function SandboxScreen({ state, onChanged }: SandboxScreenProps) {
  const projects = state.projects.filter((project) => project.hasPrototype);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState(DEVICES[0]?.id ?? 'iphone');
  const currentId = projectId ?? projects[0]?.id ?? null;
  const device = DEVICES.find((item) => item.id === deviceId) ?? DEVICES[0];
  const pending = state.tasks.find((task) => task.projectId === currentId && task.role === 'ngoai-giao' && task.status === 'awaiting_approval');

  if (!currentId || !device) return <p className="muted">Chưa có GUI demo. Ban Ngoại giao sẽ dựng sau khi phương án tác chiến được duyệt.</p>;
  return (
    <div className="sandbox">
      <div className="sandbox-bar">
        <select value={currentId} onChange={(event) => setProjectId(event.target.value)} aria-label="Chọn project">
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        {DEVICES.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`button ${item.id === device.id ? 'is-current' : ''}`} onClick={() => setDeviceId(item.id)}>
              <Icon size={13} aria-hidden /> {item.label}
            </button>
          );
        })}
      </div>
      {pending ? <TaskActions task={pending} onChanged={onChanged} /> : null}
      <SandboxFrame key={`${currentId}:${device.id}`} src={`/api/projects/${currentId}/prototype/`} width={device.width} height={device.height} />
    </div>
  );
}
