'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Cờ bật/tắt nhớ theo trình duyệt (localStorage); bộ nhớ bị chặn thì vẫn chạy bằng giá trị mặc định.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function useStoredFlag(key: string, initial: boolean): [boolean, () => void] {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) setValue(saved === '1');
    } catch {
      setValue(initial);
    }
  }, [key, initial]);

  const toggle = useCallback(() => {
    setValue((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(key, next ? '1' : '0');
      } catch {
        return next;
      }
      return next;
    });
  }, [key]);

  return [value, toggle];
}
