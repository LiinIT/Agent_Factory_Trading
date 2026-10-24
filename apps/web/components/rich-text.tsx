import type { ReactNode } from 'react';

import { type InlinePart, parseRich, REPORT_TAG, type RichLine } from '@/lib/rich-text';

/**
 * Các đoạn trong một dòng, mỗi đoạn một màu theo ý nghĩa.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function InlineParts({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.tone === 'plain' ? part.text : <span key={index} className={`rich-${part.tone}`}>{part.text}</span>,
      )}
    </>
  );
}

/**
 * Gom các dòng liền nhau: dòng ý liên tiếp thành một danh sách.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function renderLines(lines: RichLine[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let items: RichLine[] = [];
  const flushItems = () => {
    if (items.length === 0) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="rich-list">
        {items.map((item, index) => (
          <li key={index}>
            <InlineParts parts={item.parts} />
          </li>
        ))}
      </ul>,
    );
    items = [];
  };
  for (const line of lines) {
    if (line.kind === 'item') {
      items.push(line);
      continue;
    }
    flushItems();
    nodes.push(
      <p key={`line-${nodes.length}`} className={line.kind === 'report' ? 'rich-report-line' : undefined}>
        {line.kind === 'report' ? <span className="rich-report">{REPORT_TAG}</span> : null}
        {line.kind === 'report' ? ' ' : null}
        <InlineParts parts={line.parts} />
      </p>,
    );
  }
  flushItems();
  return nodes;
}

/**
 * Câu trả lời của Tham mưu trưởng / Ban Thông tin có màu: thẻ `[ BÁO CÁO ]`, từng ý một dòng,
 * chỗ quan trọng và cảnh báo tô màu. Không dùng HTML thô — chỉ dựng phần tử React.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function RichText({ text }: { text: string }) {
  return <div className="rich-text">{renderLines(parseRich(text))}</div>;
}
