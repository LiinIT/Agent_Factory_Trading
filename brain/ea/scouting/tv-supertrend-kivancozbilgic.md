---
name: tv-supertrend-kivancozbilgic
kind: scouting
source_url: https://www.tradingview.com/script/r6dAP7yi/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (House Rules); thuật toán SuperTrend là công thức công khai — chỉ lấy ý tưởng
claim_by_source: chỉ báo trailing stop dựa ATR, "đọc chính xác xu hướng đang diễn ra"; tác giả thừa nhận thường thất bại khi thị trường đi ngang
red_flags: [không có backtest, tuyên bố "chính xác" không có số liệu, thất bại ở thị trường đi ngang, tín hiệu lật liên tục]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 3, 84.1K boost, Pine v4, 37 dòng, overlay.
Nguồn mặc định hl2. Dải dưới = nguồn − 3×ATR(10), dải trên = nguồn + 3×ATR(10). Dải dưới chỉ được nâng lên khi close nến trước nằm trên dải dưới cũ (không bao giờ tụt xuống khi đang tăng); dải trên chỉ hạ xuống khi close nến trước nằm dưới dải trên cũ. Xu hướng = +1 mặc định; đổi sang −1 khi close xuyên xuống dưới dải dưới nến trước, về +1 khi close xuyên lên trên dải trên nến trước. Tín hiệu Buy = xu hướng chuyển −1→+1, Sell = +1→−1. ATR mặc định là RMA (Wilder); tuỳ chọn SMA của True Range.

**KIỂM LOGIC**
- Công thức: như trên; mọi so sánh dùng `close` và dải nến trước.
- Nến đóng hay đang hình thành: trên nến realtime, `close` là giá hiện tại ⇒ tín hiệu có thể bật rồi tắt trong nến; lịch sử chỉ thấy bản đã đóng. Trên nến đóng thì cố định.
- Repaint/look-ahead: mã hiển thị không dùng `request.security` hay pivot ⇒ không nhìn trước, không vẽ lại lịch sử; chỉ nhấp nháy nội nến. Ghi chú phát hành nói có thêm tuỳ chọn khung thời gian (2021) nhưng mã hiển thị trong trang không có đoạn đó — nếu bật MTF của bản khác thì phải kiểm lại lookahead.
- Tham số mặc định: ATR 10, hệ số 3.0, nguồn hl2, ATR kiểu RMA, hiện tín hiệu và tô nền bật.
- Điểm yếu: trễ vì là trailing stop; whipsaw mạnh khi đi ngang; một tham số cho mọi chế độ biến động; không có SL/TP/lot; mã có lỗi nhỏ khi `up1`/`dn1` ở bar đầu (không ảnh hưởng thực tế).
- Chuyển EA MT5 vàng: CÓ — thuật toán tất định, cài được trên nến đóng (dùng iATR + trạng thái trên nến [1]). Dùng làm bộ xác định xu hướng hoặc trailing stop; vàng xu hướng dài theo phiên nên có chỗ, nhưng cần kiểm lại trên giai đoạn đi ngang. Mức ưu tiên cao (đã có nhiều bản trong bộ não nếu trùng — kiểm hypotheses/ trước khi làm).
- Giấy phép: không có điều khoản tái sử dụng rõ; công thức công khai nên viết lại độc lập.
**Vì sao đáng thử:** nền tảng đơn giản cho EA theo xu hướng hoặc bộ trailing; không đáng thử như hệ thống đứng một mình (không có lọc đi ngang).
