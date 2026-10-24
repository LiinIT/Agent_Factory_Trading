'use client';

import { ChevronDown, ChevronUp, Package, RadioTower, ShieldCheck } from 'lucide-react';

import { roleIcon } from '@/lib/role-icons';
import type { TeamRole } from '@/lib/types';

import { MANAGER_ROLE, ROLE_ORDER as TEAM_ORDER } from '@/lib/org';

const SUPPORT_UNITS = [
  { icon: RadioTower, unit: 'Ban Thông tin', duty: 'Chuyển lệnh và báo cáo, quản lý hàng đợi (máy)' },
  { icon: Package, unit: 'Ban Hậu cần', duty: 'Đo thiệt hại: thời gian, token, quota; báo động 10% (máy)' },
  { icon: ShieldCheck, unit: 'Ban Bảo mật', duty: 'Xét cấp quyền, chặn lệnh nguy hiểm (máy)' },
];

const ROLE_ORDER = [MANAGER_ROLE, ...TEAM_ORDER];

type DutyNoteProps = {
  team: TeamRole[];
  isOpen: boolean;
  onToggle: () => void;
};

/**
 * Ghi chú nhỏ góc dưới bên phải: chức năng từng ban, model đang dùng, ban nào có cổng
 * duyệt. Nội dung lấy từ `duty` trong team/*.md. Thu gọn bằng phím N.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function DutyNote({ team, isOpen, onToggle }: DutyNoteProps) {
  const roles = team.toSorted((first, second) => ROLE_ORDER.indexOf(first.name) - ROLE_ORDER.indexOf(second.name));
  return (
    <aside className={`duty-note ${isOpen ? 'is-open' : ''}`} aria-label="Chức năng các ban">
      <button className="duty-head" onClick={onToggle} aria-expanded={isOpen}>
        <span>CHỨC NĂNG CÁC BAN</span>
        <kbd>N</kbd>
        {isOpen ? <ChevronDown size={13} aria-hidden /> : <ChevronUp size={13} aria-hidden />}
      </button>
      {isOpen ? (
        <ul className="duty-list">
          {roles.map((role) => {
            const Icon = roleIcon(role.name);
            return (
              <li key={role.name} title={`${role.unit}: ${role.duty} · model ${role.model}${role.gate ? ' · có cổng duyệt' : ''}`}>
                <Icon size={12} aria-hidden className="accent" />
                <span className="duty-unit">{role.unit}</span>
                <span className="duty-text">{role.duty}</span>
                <span className="duty-model">{role.model}</span>
              </li>
            );
          })}
          {SUPPORT_UNITS.map(({ icon: Icon, unit, duty }) => (
            <li key={unit} title={`${unit}: ${duty}`}>
              <Icon size={12} aria-hidden className="muted" />
              <span className="duty-unit">{unit}</span>
              <span className="duty-text muted">{duty}</span>
              <span className="duty-model">máy</span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
