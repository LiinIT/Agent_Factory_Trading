export const FOLLOW_PROPOSAL = 'Theo đề xuất của ban';

const TRAILING_OPTIONS = /^(.*?)\s*\[([^[\]]+)\]\s*$/s;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

export type ParsedQuestion = { text: string; options: string[] };

const NO_QUESTION: ParsedQuestion = { text: 'Ban chưa ghi câu hỏi cụ thể — xem đề xuất ở trên.', options: ['Đồng ý', FOLLOW_PROPOSAL] };

/**
 * Danh sách câu hỏi để hiện nút chọn; ban hỏi mà không ghi câu nào thì vẫn có nút Đồng ý / Theo đề xuất.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseQuestions(questions: string[]): ParsedQuestion[] {
  return questions.length > 0 ? questions.map(parseQuestion) : [NO_QUESTION];
}

/**
 * Tách câu hỏi của ban thành nội dung + đáp án gợi ý ở cuối dạng `[A | B | C]`;
 * không có (hoặc sai dạng) thì chỉ có nút chung "Theo đề xuất của ban".
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function parseQuestion(question: string): ParsedQuestion {
  const match = TRAILING_OPTIONS.exec(question.trim());
  const options = match?.[2]?.split('|').map((option) => option.trim()).filter(Boolean) ?? [];
  if (!match || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) return { text: question.trim(), options: [FOLLOW_PROPOSAL] };
  return { text: match[1] ?? question, options: [...options, FOLLOW_PROPOSAL] };
}

/**
 * Ghép các đáp án đã chọn thành câu trả lời gửi ban, theo số thứ tự câu hỏi.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function composeAnswer(choices: (string | null)[]): string {
  if (choices.length === 1) return choices[0] ?? '';
  return choices.map((choice, index) => (choice ? `${index + 1}. ${choice}` : '')).filter(Boolean).join('\n');
}
