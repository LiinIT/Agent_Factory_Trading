import {
  Brain,
  Construction,
  Crosshair,
  Handshake,
  type LucideIcon,
  ShieldCheck,
  Stamp,
  Swords,
  UserRound,
} from 'lucide-react';

const ROLE_ICONS: Record<string, LucideIcon> = {
  'tham-muu-truong': Brain,
  'tac-chien': Crosshair,
  'ngoai-giao': Handshake,
  'cong-binh': Construction,
  'xung-kich': Swords,
  'kiem-soat': ShieldCheck,
  'nghiem-thu': Stamp,
};

/**
 * Icon vector (lucide) của từng ban; ban lạ dùng icon người.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function roleIcon(roleName: string): LucideIcon {
  return ROLE_ICONS[roleName] ?? UserRound;
}
