'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from './api';
import type { BusEvent, FactoryState } from './types';

const RECONNECT_DELAY_MS = 3000;
const LOG_BUFFER = 200;

export type LiveLog = { seq: number; taskId: number; kind: string; text: string };

/**
 * Trạng thái toàn hệ thống + log trực tiếp, cập nhật qua SSE `/api/events`.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function useFactory() {
  const [state, setState] = useState<FactoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
  const refreshing = useRef(false);
  const logSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      setState(await api.state());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      refreshing.current = false;
    }
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      source = new EventSource('/api/events');
      source.onopen = () => {
        setConnected(true);
        void refresh();
      };
      source.onmessage = (message) => {
        const event = JSON.parse(message.data) as BusEvent;
        if (event.type === 'log') {
          const entry = { ...event, seq: ++logSeq.current };
          setLiveLogs((logs) => [...logs, entry].slice(-LOG_BUFFER));
        } else {
          void refresh();
        }
      };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (!closed) retryTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    void refresh();
    connect();
    return () => {
      closed = true;
      source?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [refresh]);

  return { state, error, connected, liveLogs, refresh };
}
