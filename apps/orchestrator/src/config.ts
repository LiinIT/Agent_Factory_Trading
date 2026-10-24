import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import type { BrowserPolicy } from './browser-guard.ts';
import type { EaConfig } from './ea-runner.ts';
import type { FactoryMode, ModeProfile } from './mode.ts';

export const ROOT_DIR = resolve(import.meta.dirname, '../../..');

export type FactoryConfig = {
  rootDir: string;
  host: string;
  port: number;
  concurrency: number;
  taskTimeoutMinutes: number;
  managerTimeoutMinutes: number;
  managerHistoryLimit: number;
  quota: {
    pauseAtFiveHourUtilization: number;
    pauseAtSevenDayUtilization: number;
    fallbackPauseMinutes: number;
    alarmFiveHourDeltaPerTask: number | null;
  };
  localModel: string;
  bugLoop: { maxRounds: number };
  spendCapUsd: number;
  openAiPricePerMillion: { input: number; output: number };
  modes: Partial<Record<FactoryMode, ModeProfile>>;
  ea: EaConfig;
  browser: BrowserPolicy;
  brainEaDir: string;
  workspaceDir: string;
  dataDir: string;
  basesDir: string;
  teamDir: string;
  skillsDir: string;
  templateDir: string;
};

/**
 * Đổi `~/…` thành đường dẫn trong thư mục nhà; đường dẫn khác giữ nguyên.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function expandHome(path: string): string {
  return path === '~' || path.startsWith('~/') ? join(homedir(), path.slice(1)) : path;
}

/**
 * Đọc `config/factory.json` và đổi các thư mục thành đường dẫn tuyệt đối.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function loadConfig(rootDir: string = ROOT_DIR): FactoryConfig {
  const raw = JSON.parse(
    readFileSync(resolve(rootDir, 'config/factory.json'), 'utf8'),
  );
  return {
    ...raw,
    rootDir,
    ea: {
      ...raw.ea,
      mt5Dir: expandHome(raw.ea.mt5Dir),
      winePrefix: expandHome(raw.ea.winePrefix),
      wineApp: expandHome(raw.ea.wineApp),
    },
    browser: { ...raw.browser, deviceId: process.env.DV2_CHROME_DEVICE_ID ?? raw.browser?.deviceId },
    brainEaDir: resolve(rootDir, 'brain/ea'),
    workspaceDir: resolve(rootDir, expandHome(raw.workspaceDir)),
    dataDir: resolve(rootDir, raw.dataDir),
    basesDir: resolve(rootDir, 'bases'),
    teamDir: resolve(rootDir, 'team'),
    skillsDir: resolve(rootDir, 'skills'),
    templateDir: resolve(rootDir, 'templates/project'),
  };
}
