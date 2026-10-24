---
name: tv-ut-bot-alerts-quantnomad
kind: scouting
source_url: https://www.tradingview.com/script/n8ss8BID-UT-Bot-Alerts/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (House Rules); gốc từ HPotter và Yo_adriiiiaan, QuantNomad chuyển sang cảnh báo v4 — chỉ lấy ý tưởng
claim_by_source: cảnh báo mua/bán dựa trailing stop ATR; không nêu số liệu (bản chiến lược gốc là script khác, không đọc ở đây)
red_flags: [không có backtest ở trang này, nhiều đời tác giả, tác giả bán dịch vụ tư vấn, tuỳ chọn Heikin Ashi dễ làm đẹp lịch sử]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 9, 60.8K boost, Pine v4, 42 dòng, overlay.
Trailing stop ATR theo close: khoảng cách = a×ATR(10) với a = 1. Khi close nằm trên stop ở cả hai nến liên tiếp thì stop chỉ được nâng (max của stop cũ và close − khoảng cách); khi close nằm dưới stop ở cả hai nến thì stop chỉ được hạ; ở nến đầu tiên đổi bên thì đặt lại stop ở phía đối diện. Mua = close nằm trên stop và vừa cắt lên qua stop; Bán ngược lại. Nến tô xanh/đỏ theo vị trí close so với stop. Tuỳ chọn dùng nến Heikin Ashi.

**KIỂM LOGIC**
- Công thức: như trên; về bản chất giống SuperTrend dùng close thay hl2 và hệ số 1.
- Nến đóng hay đang hình thành: dùng close hiện tại và không chặn `barstate.isconfirmed` ⇒ trên nến realtime tín hiệu có thể bật rồi mất; cảnh báo mặc định "mỗi lần chạm" cũng có thể bắn sớm. Trên lịch sử là bản đã đóng.
- Repaint/look-ahead: mặc định không dùng `security`. Nếu bật Heikin Ashi thì `security(heikinashi…, lookahead=false)` nên không nhìn trước, nhưng close của nến HA đang chạy đổi liên tục nên vẫn nhấp nháy; HA làm mượt hơn nên lịch sử trông đẹp hơn thực tế. Không có pivot trễ.
- Tham số mặc định: a = 1 (rất nhạy), ATR 10, không dùng Heikin Ashi.
- Điểm yếu: a = 1 quá hẹp ⇒ lật liên tục khi đi ngang (whipsaw nặng), trên vàng M5/M15 sẽ thua phí; không có lọc xu hướng, không có SL/TP, không quản lý lot. Mô tả chỉ nói đây là cảnh báo của chiến lược khác.
- Chuyển EA MT5 vàng: CÓ — thuật toán tất định trên nến đóng. Gần SuperTrend nên dùng chung khối, phải tăng a (vd 2–3) và thêm lọc đi ngang, nếu không là hệ thống nhiều lệnh nhỏ thua. Kiểm hypotheses/ xem ATR trailing đã thử chưa.
- Giấy phép: không điều khoản tái sử dụng rõ; ý tưởng gốc công khai.
**Vì sao đáng/không đáng thử:** trùng ý với thẻ tv-supertrend-kivancozbilgic; chỉ đáng thử như biến thể (close, hệ số tham số hoá) trong cùng một họ trailing, không phải ý tưởng mới.
