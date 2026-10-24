'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const COPIED_RESET_MS = 1500;

/**
 * Mục "Cách chạy" trong báo cáo: lệnh / thao tác để Chỉ huy trưởng tự chạy kết quả. Lệnh của ban
 * viết theo thư mục project, nên nút chép ghép sẵn `cd "<thư mục project>"` để dán vào terminal là chạy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function RunInstructions({ text, projectPath }: { text: string; projectPath: string | null }) {
  const [isCopied, setIsCopied] = useState(false);
  const runnable = projectPath ? `cd "${projectPath}"\n${text}` : text;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(runnable);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    } catch {
      setIsCopied(false);
    }
  };
  return (
    <div className="run-instructions">
      <div className="run-head">
        <span className="tier-label">Cách chạy</span>
        <button type="button" className="icon-button is-small" onClick={() => void copy()} aria-label="Chép lệnh chạy (kèm cd vào thư mục project)">
          {isCopied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
        </button>
      </div>
      <pre className="run-code">{runnable}</pre>
    </div>
  );
}
