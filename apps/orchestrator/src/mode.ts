import type { FactoryStore } from './store.ts';
import type { RoleDefinition } from './types.ts';

export type FactoryMode = 'chuan' | 'ta-mon';

export type ModeProfile = {
  models: Record<string, string>;
  effort: Record<string, string>;
  machineCheck: boolean;
  notes: Record<string, string>;
};

export type RoleRun = {
  model: string;
  effort?: string;
  systemPrompt: string;
  useMachineCheck: boolean;
};

const MODE_KEY = 'mode';
const ALL_ROLES = '*';
const MODES: FactoryMode[] = ['chuan', 'ta-mon'];

const COMMAND_RULES = `## Quy tắc lệnh Bash (để không bị chặn)
- Mỗi lần gọi Bash chỉ **một lệnh đơn** đúng với quyền được cấp: không nối \`&&\`, \`;\`, \`|\`, không vòng \`for\`, không định nghĩa hàm, không \`cd\` — lệnh đã chạy sẵn trong thư mục project, dùng đường dẫn tương đối.
- Biên dịch EA: \`./dv2 compile ea/<tên>.mq5\` từ gốc project (máy chạy MetaEditor portable, in dòng \`Result:\`).
- Đọc / tìm file: dùng tool Read, Glob, Grep thay cho \`cat\`, \`find\`, \`grep\`.
- Lệnh ngoài danh sách bị từ chối tự động: ghi vào \`obstacles\` lệnh cần dùng và lý do, không tìm cách lách.`;

/**
 * Chế độ vận hành (Chuẩn / Tà môn), lưu trong DB để sống qua lần khởi động lại.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class ModeState {
  readonly store: FactoryStore;
  readonly profiles: Partial<Record<FactoryMode, ModeProfile>>;

  /**
   * Khởi tạo với store và các cấu hình chế độ (từ config).
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  constructor(store: FactoryStore, profiles: Partial<Record<FactoryMode, ModeProfile>>) {
    this.store = store;
    this.profiles = profiles;
  }

  /**
   * Chế độ hiện tại.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  current(): FactoryMode {
    return this.store.getSetting<FactoryMode>(MODE_KEY, 'chuan');
  }

  /**
   * Đổi chế độ; giá trị lạ bị từ chối.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  set(mode: string): FactoryMode {
    if (!MODES.includes(mode as FactoryMode)) throw new Error(`Chế độ không hợp lệ: ${mode}`);
    this.store.setSetting(MODE_KEY, mode);
    return mode as FactoryMode;
  }

  /**
   * Cách chạy một ban theo chế độ: model, effort, system prompt (kèm skill bắt buộc
   * và ghi chú chế độ), có dùng máy tự kiểm soát hay không.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  roleRun(role: RoleDefinition): RoleRun {
    const mode = this.current();
    const profile = mode === 'chuan' ? undefined : this.profiles[mode];
    const parts = [role.prompt];
    if (role.skills.length > 0) {
      parts.push(`## Skill bắt buộc (gọi bằng tool Skill khi cần)\n${role.skills.map((skill) => `- ${skill}`).join('\n')}`);
    }
    if (role.allowedTools.some((tool) => tool.startsWith('Bash('))) parts.push(COMMAND_RULES);
    const notes = [profile?.notes[ALL_ROLES], profile?.notes[role.name]].filter(Boolean);
    if (notes.length > 0) parts.push(`## Chế độ vận hành\n${notes.join('\n')}`);
    return {
      model: profile?.models[role.name] ?? role.model,
      effort: profile?.effort[role.name],
      systemPrompt: parts.join('\n\n'),
      useMachineCheck: profile?.machineCheck === true,
    };
  }
}
