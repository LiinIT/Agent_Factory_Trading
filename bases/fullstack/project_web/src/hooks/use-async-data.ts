'use client';

import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> = { isLoading: boolean; error: Error | null; data: T | null; reload: () => void };

/**
 * Tải dữ liệu bất đồng bộ với đủ 3 trạng thái: đang tải / lỗi / có dữ liệu, kèm nút tải lại.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-20
 */
export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ isLoading: boolean; error: Error | null; data: T | null }>({ isLoading: true, error: null, data: null });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let isActive = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    load()
      .then((data) => isActive && setState({ isLoading: false, error: null, data }))
      .catch((error: unknown) => isActive && setState({ isLoading: false, error: error instanceof Error ? error : new Error(String(error)), data: null }));
    return () => {
      isActive = false;
    };
  }, [attempt, ...deps]);

  return { ...state, reload };
}
