'use client';

import { useEffect, useRef } from 'react';

import type { Task } from './types';

const APP_TITLE = 'Dacvu_zero';

/**
 * Báo ngay khi có việc mới cần Chỉ huy trưởng (chờ duyệt / chờ trả lời / xin quyền): gọi
 * [onNewPending] một lần cho mỗi việc mới (cả lúc mở trang) và hiện số việc chờ trên tiêu đề tab.
 * Việc đã báo mà vẫn chờ thì không bật lại; việc quay lại trạng thái chờ lần nữa thì báo lại.
 * Xử lý xong việc cuối cùng thì gọi [onAllCleared] (đóng popup).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function useOwnerAlerts(pending: Task[], onNewPending: () => void, onAllCleared: () => void): void {
  const seen = useRef(new Set<string>());
  const onNewPendingRef = useRef(onNewPending);
  const onAllClearedRef = useRef(onAllCleared);
  onNewPendingRef.current = onNewPending;
  onAllClearedRef.current = onAllCleared;

  const keys = pending.map((task) => `${task.id}:${task.status}:${task.deniedTools.length}`);
  const signature = keys.join(',');

  useEffect(() => {
    const fresh = keys.filter((key) => !seen.current.has(key));
    const wasPending = seen.current.size > 0;
    seen.current = new Set(keys);
    if (fresh.length > 0) onNewPendingRef.current();
    if (wasPending && keys.length === 0) onAllClearedRef.current();
    document.title = keys.length > 0 ? `(${keys.length}) ${APP_TITLE}` : APP_TITLE;
  }, [signature]);
}
