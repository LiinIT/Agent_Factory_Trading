import { EventEmitter } from 'node:events';

export type BusEvent =
  | { type: 'state' }
  | { type: 'log'; taskId: number; kind: string; text: string }
  | { type: 'manager'; busy: boolean };

/**
 * Kênh sự kiện nội bộ: mọi thay đổi trạng thái đẩy ra đây để SSE gửi cho web.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export class FactoryBus extends EventEmitter {
  /**
   * Phát một sự kiện cho mọi trình duyệt đang nghe.
   * Author: HoNgocKhanh
   * Company: MiaStudio
   * Time: 2026-10-16
   */
  publish(event: BusEvent): void {
    this.emit('event', event);
  }
}
