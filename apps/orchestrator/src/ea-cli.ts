import { resolve } from 'node:path';

import { loadConfig } from './config.ts';
import { compileExpert } from './ea-runner.ts';

const USAGE = 'Dùng: ./dv2 compile <đường-dẫn-.mq5-trong-project>';

/**
 * Lệnh `./dv2 compile ea/<tên>.mq5` cho các ban: biên dịch bằng MetaEditor portable, in dòng Result.
 * Thư mục project là thư mục hiện tại; mã thoát 0 chỉ khi 0 lỗi và 0 cảnh báo.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-24
 */
async function main(): Promise<void> {
  const [command, source] = process.argv.slice(2);
  if (command !== 'compile' || !source) {
    console.error(USAGE);
    process.exit(2);
  }
  const projectDir = process.cwd();
  const projectId = resolve(projectDir).split('/').pop() ?? 'project';
  const result = await compileExpert(projectDir, projectId, source, loadConfig().ea);
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}

void main();
