const XCODE_PROJECT = /\.pbxproj$/;
const DEVELOPMENT_TEAM_LINE = /^[ \t]*DEVELOPMENT_TEAM = [^;\n]*;[ \t]*\r?\n/gm;
const AI_MARKER_LINE =
  /^[ \t]*(?:\/\/+|#+|\/?\*+|<!--|--)?[ \t]*(?:🤖[ \t]*)?(?:generated (?:with|by)[ \t]+\[?claude|co-authored-by:[^\n]*(?:claude|anthropic))[^\n]*(?:\r?\n|$)/gim;
const AI_TRAILER_LINE = /^[ \t]*co-authored-by:[^\n]*(?:claude|anthropic)[^\n]*$/gim;
const BLANK_RUN = /\n{3,}$/;

/**
 * Bỏ dấu khỏi nội dung một file trước khi commit: dấu ký Apple (`DEVELOPMENT_TEAM`
 * trong project Xcode) và dòng ghi dấu AI ("Generated with Claude", "Co-Authored-By: Claude").
 * Chỉ xoá cả dòng khớp đúng mẫu, không đụng code khác.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function scrubText(path: string, text: string): string {
  const unsigned = XCODE_PROJECT.test(path) ? text.replace(DEVELOPMENT_TEAM_LINE, '') : text;
  return unsigned.replace(AI_MARKER_LINE, '');
}

/**
 * Bỏ trailer ghi dấu AI khỏi message commit.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function scrubCommitMessage(message: string): string {
  return message.replace(AI_TRAILER_LINE, '').replace(BLANK_RUN, '\n').trim();
}
