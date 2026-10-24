'use client';

import { useState } from 'react';

type ProjectFieldFormProps = {
  label: string;
  initialValue: string;
  placeholder: string;
  hint: string;
  submitLabel: string;
  onSubmit: (value: string) => Promise<unknown>;
};

/**
 * Một ô cài đặt của project (nơi lưu / git remote): nhập, bấm lưu, hiện lỗi server trả về.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ProjectFieldForm({ label, initialValue, placeholder, hint, submitLabel, onSubmit }: ProjectFieldFormProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(value.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <form
      className="project-field"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="muted">{label}</label>
      <div className="project-field-row">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} spellCheck={false} autoComplete="off" />
        <button className="button" type="submit" disabled={isSaving || value.trim() === initialValue}>
          {submitLabel}
        </button>
      </div>
      <p className="muted project-field-hint">{hint}</p>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
