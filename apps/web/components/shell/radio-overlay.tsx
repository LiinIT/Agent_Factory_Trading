'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { RadioAurora } from './radio-aurora';

import './radio-overlay.css';

type RadioOverlayProps = {
  isListening: boolean;
  interim: string;
  notice: string | null;
  error: string | null;
};

/**
 * Cực quang trong suốt phủ viền màn hình, giữ rõ agent và lời nói ở mép dưới.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function RadioOverlay({ isListening, interim, notice, error }: RadioOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const isVisible = isListening || !!notice;
  const hasError = !!notice && notice === error;
  const isActive = isListening && !hasError;
  const message = isActive ? interim || 'Giữ Space để nói · Thả phím để gửi' : notice;
  let status = 'TRỢ LÝ';
  if (isActive) status = 'ĐANG NGHE';
  if (hasError) status = 'CẦN KIỂM TRA MICRO';

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.section
          className={`radio-assistant ${isActive ? 'is-listening' : 'is-notice'}${hasError ? ' is-error' : ''}`}
          aria-label="Trợ lý giọng nói Đặc Vụ Zero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.45 }}
        >
          <RadioAurora />
          <div className="radio-assistant-caption">
            <div className="radio-assistant-state" role="status" aria-live="polite">
              <span className="radio-assistant-status-light" aria-hidden="true" />
              {status}
            </div>
            <p className="radio-assistant-transcript" aria-live={isActive ? 'off' : 'polite'}>{message}</p>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
