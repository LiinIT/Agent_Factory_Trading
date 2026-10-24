type QuestionChoicesProps = {
  options: string[];
  selected: string | null;
  isDisabled: boolean;
  onChoose: (option: string) => void;
};

/**
 * Hàng nút đáp án gợi ý của một câu hỏi; đáp án đầu (ban khuyên dùng) nổi bật hơn.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function QuestionChoices({ options, selected, isDisabled, onChoose }: QuestionChoicesProps) {
  return (
    <div className="question-choices">
      {options.map((option, index) => (
        <button
          key={`${index}-${option}`}
          type="button"
          className={`button choice ${index === 0 ? 'is-recommended' : ''} ${selected === option ? 'is-selected' : ''}`}
          disabled={isDisabled}
          aria-pressed={selected === option}
          onClick={() => onChoose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
