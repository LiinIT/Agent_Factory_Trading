import { execFileSync } from 'node:child_process';

import { log } from './logger.ts';

type SimDevice = { udid: string; name: string; state: string; isAvailable?: boolean };

/**
 * Chọn máy ảo iPhone để chạy integration test: ưu tiên máy đang bật, không có thì
 * máy iPhone khả dụng đầu tiên. Không có Xcode / simulator thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function resolveIosSimulator(): string | null {
  try {
    const output = execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], { encoding: 'utf8' });
    const runtimes = JSON.parse(output).devices as Record<string, SimDevice[]>;
    const iphones = Object.values(runtimes).flat().filter((device) => device.name.startsWith('iPhone'));
    const chosen = iphones.find((device) => device.state === 'Booted') ?? iphones[0];
    log.info({ simulator: chosen?.name ?? null }, '[Simulator] chọn máy ảo iOS');
    return chosen?.udid ?? null;
  } catch (error) {
    log.warn({ err: error }, '[Simulator] không dùng được simctl');
    return null;
  }
}
