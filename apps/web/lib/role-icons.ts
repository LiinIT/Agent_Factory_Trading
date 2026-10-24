import {
  Brain,
  Bug,
  ChartLine,
  Cpu,
  FileChartColumn,
  FlaskConical,
  Hammer,
  Library,
  type LucideIcon,
  Microscope,
  PencilRuler,
  Scale,
  ScanSearch,
  Stamp,
  Telescope,
  UserRound,
} from 'lucide-react';

const ROLE_ICONS: Record<string, LucideIcon> = {
  'tham-muu-truong': Brain,
  'ea-trinh-sat': Telescope,
  'ea-mo-xe': Microscope,
  'ea-nghien-cuu': FlaskConical,
  'ea-thiet-ke': PencilRuler,
  'ea-che-tao': Hammer,
  'ea-soat-ma': Bug,
  'ea-dung-ban-thu': Cpu,
  'ea-thu-nghiem': ScanSearch,
  'ea-phan-tich': ChartLine,
  'ea-phan-bien': Scale,
  'ea-nghiem-thu': Stamp,
  'ea-ghi-nho': Library,
  'ea-bao-cao': FileChartColumn,
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
