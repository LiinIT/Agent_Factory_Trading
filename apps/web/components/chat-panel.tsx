'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

import { Mic } from 'lucide-react';

import { api } from '@/lib/api';
import { useVoice } from '@/lib/use-voice';
import { ACCOUNT_CARD_AUTHOR, type Message, type Project } from '@/lib/types';

import { AccountSwitchCard } from './account-switch-card';
import { ChatMessage } from './chat-message';
import { VoiceButton } from './voice-button';

const IME_PROCESS_KEY_CODE = 229;
const SECRET_LIKE = /sk-ant-[A-Za-z0-9_-]{16,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}/;
const SECRET_IN_CHAT = 'Không dán token/khoá vào chat — dùng ô nhập token trong thẻ đổi tài khoản hoặc màn Env.';

type MessageSource = 'draft' | 'voice';

/**
 * Tin báo hết hạn mức cần kèm thẻ đổi tài khoản: tin gần nhất loại đó, khi sau nó
 * Tham mưu trưởng chưa trả lời được lần nào.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
function accountCardMessageId(messages: Message[]): number | null {
  const index = messages.findLastIndex((message) => message.author === ACCOUNT_CARD_AUTHOR);
  if (index < 0) return null;
  const isAnsweredLater = messages.slice(index + 1).some((message) => message.sender === 'manager');
  return isAnsweredLater ? null : (messages[index]?.id ?? null);
}

type ChatPanelProps = {
  messages: Message[];
  projects: Project[];
  projectId: string | null;
  managerBusy: boolean;
  onProjectChange: (projectId: string | null) => void;
};

/**
 * Kênh liên lạc với Tham mưu trưởng: gõ hoặc giữ nút để nói. Mở ra là ô nhập được focus;
 * ô trống thì giữ Space để nói, thả ra để gửi. Đọc to câu trả lời bật/tắt ở thanh trên cùng (phím M).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function ChatPanel({ messages, projects, projectId, managerBusy, onProjectChange }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const listEnd = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  /**
   * Gửi một lệnh cho Tham mưu trưởng, mỗi lúc chỉ một lệnh; lệnh gõ tay được xoá
   * khỏi ô nhập ngay và trả lại ô nhập nếu gửi lỗi. Chuỗi giống token bị chặn và xoá
   * hẳn, không gửi đi và không trả lại ô nhập.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  const send = async (text: string, source: MessageSource) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    if (SECRET_LIKE.test(trimmed)) {
      if (source === 'draft') setDraft('');
      setSendError(SECRET_IN_CHAT);
      return;
    }
    sendingRef.current = true;
    setIsSending(true);
    if (source === 'draft') setDraft('');
    try {
      await api.chat(trimmed, projectId);
      setSendError(null);
    } catch (error) {
      if (source === 'draft') setDraft((current) => current || trimmed);
      setSendError(error instanceof Error ? error.message : String(error));
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };
  const voice = useVoice((text) => void send(text, 'voice'));

  const conversation = messages.filter((message) => message.sender === 'user' || message.sender === 'manager' || message.sender === 'system');
  const visible = projectId ? conversation.filter((message) => message.projectId === projectId || !message.projectId) : conversation;
  const cardMessageId = accountCardMessageId(visible);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <section className="chat">
      <div className="panel-head">
        <h2>Tham mưu trưởng</h2>
        <select value={projectId ?? ''} onChange={(event) => onProjectChange(event.target.value || null)} aria-label="Chọn project">
          <option value="">Tất cả project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>
      <div className="chat-list">
        {visible.length === 0 ? <p className="muted">Chỉ huy trưởng ra lệnh: muốn nghiên cứu hay làm bot EA nào?</p> : null}
        {visible.map((message) => (
          <Fragment key={message.id}>
            <ChatMessage message={message} />
            {message.id === cardMessageId ? <AccountSwitchCard /> : null}
          </Fragment>
        ))}
        {managerBusy ? <p className="muted">Tham mưu trưởng đang xử lý…</p> : null}
        <div ref={listEnd} />
      </div>
      {voice.interim ? (
        <p className="interim inline-icon">
          <Mic size={13} aria-hidden /> {voice.interim}
        </p>
      ) : null}
      {sendError || voice.voiceError ? <p className="error">{sendError ?? voice.voiceError}</p> : null}
      <form className="composer" onSubmit={(event) => { event.preventDefault(); void send(draft, 'draft'); }}>
        <textarea
          value={draft}
          placeholder="Lệnh, ví dụ: làm bot vàng M15 theo xu hướng, vốn 1000… (ô trống: giữ Space để nói)"
          onChange={(event) => setDraft(event.target.value)}
          ref={input}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === IME_PROCESS_KEY_CODE) return;
            if (event.code === 'Space' && draft === '') {
              event.preventDefault();
              if (!event.repeat) voice.start();
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send(draft, 'draft');
            }
          }}
          onKeyUp={(event) => {
            if (event.code === 'Space' && voice.isListening) voice.stop();
          }}
          rows={2}
        />
        <div className="composer-actions">
          <VoiceButton isSupported={voice.isSupported} isListening={voice.isListening} onStart={voice.start} onStop={voice.stop} />
          <button className="button button-primary" type="submit" disabled={!draft.trim() || isSending}>Gửi</button>
        </div>
      </form>
    </section>
  );
}
