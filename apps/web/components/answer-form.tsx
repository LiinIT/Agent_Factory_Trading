'use client';

import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { composeAnswer, parseQuestions } from '@/lib/question-options';
import type { Task } from '@/lib/types';

import { QuestionChoices } from './question-choices';

/**
 * Câu hỏi của một ban + nút chọn nhanh đáp án. Một câu hỏi: bấm là gửi luôn. Nhiều câu: chọn
 * từng câu, câu trả lời tự ghép vào ô (sửa thêm được) rồi bấm Trả lời. Vẫn gõ tay được như cũ.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function AnswerForm({ task, onChanged }: { task: Task; onChanged: () => void }) {
  const questions = parseQuestions(task.questions);
  const [choices, setChoices] = useState<(string | null)[]>(() => questions.map(() => null));
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await api.answer(task.id, text.trim());
      setAnswer('');
      setAnswerError(null);
      onChanged();
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSending(false);
    }
  };

  const choose = (index: number, option: string) => {
    if (questions.length === 1) {
      void send(option);
      return;
    }
    const next = choices.map((choice, position) => (position === index ? option : choice));
    setChoices(next);
    setAnswer(composeAnswer(next));
  };

  return (
    <div className="answer">
      <ol className="questions">
        {questions.map((question, index) => (
          <li key={index}>
            {question.text}
            <QuestionChoices options={question.options} selected={choices[index] ?? null} isDisabled={isSending} onChoose={(option) => choose(index, option)} />
          </li>
        ))}
      </ol>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Hoặc gõ câu trả lời (theo số thứ tự câu hỏi)"
        rows={2}
      />
      <button className="button button-primary" disabled={!answer.trim() || isSending} onClick={() => void send(answer)}>
        <SendHorizontal size={13} aria-hidden /> Trả lời
      </button>
      {answerError ? <p className="error">{answerError}</p> : null}
    </div>
  );
}
