---
name: tv-macd-mtf-chrismoody
kind: scouting
source_url: https://www.tradingview.com/script/OQx7vju0-MacD-Custom-Indicator-Multiple-Time-Frame-All-Available-Options/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (House Rules); MACD là công thức công khai — chỉ lấy ý tưởng
claim_by_source: MACD có histogram 4 màu, chấm tại điểm cắt, chọn khung thời gian khác; không nêu hiệu quả giao dịch (tác giả hứa mô tả đầy đủ ở bài đầu nhưng bình luận người dùng nói không tìm thấy)
red_flags: [không có backtest, tài liệu hướng dẫn thất lạc, tác giả quảng bá dịch vụ riêng, gọi security đa khung chưa nói rõ độ trễ]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 4, 82.5K boost, Pine v1 (2014), 54 dòng, dao động.
MACD chuẩn: EMA12(close) − EMA26(close); đường tín hiệu = SMA9 của MACD (không phải EMA); histogram = MACD − tín hiệu. Tuỳ chọn tính trên khung hiện tại hoặc khung khác (mặc định 60 phút) qua `security`. Histogram 4 màu theo (dương/âm) × (tăng/giảm so với nến trước). Đường MACD xanh khi MACD ≥ tín hiệu, đỏ khi nhỏ hơn; chấm vẽ tại điểm cắt.

**KIỂM LOGIC**
- Công thức: như trên; không có quy tắc vào/ra; tín hiệu ngầm là MACD cắt đường tín hiệu hoặc histogram đổi dấu.
- Nến đóng hay đang hình thành: trên khung hiện tại, tính theo close hiện hành ⇒ nhấp nháy nội nến, cố định khi nến đóng. Ở khung khác, giá trị là của nến khung cao ĐANG hình thành.
- Repaint/look-ahead: `security` (Pine v1, không nêu lookahead nên mặc định không nhìn trước). Trên lịch sử, mỗi nến thấp lấy giá trị cuối cùng của nến cao ⇒ trông như "đã biết trước" kết quả khung cao; trên realtime giá trị khung cao còn thay đổi ⇒ lịch sử và realtime khác nhau (repaint kiểu MTF). Không có pivot trễ.
- Tham số mặc định: 12/26/9; dùng khung hiện tại; khung khác 60; mọi tuỳ chọn hiển thị bật.
- Điểm yếu: MACD chậm và đưa nhiều tín hiệu giả khi đi ngang; histogram "tăng/giảm" bằng so sánh tuyệt đối trên 1 nến rất nhiễu; MTF gây sai lệch giữa lịch sử và realtime.
- Chuyển EA MT5 vàng: CÓ NHƯNG GIÁ TRỊ THẤP — iMACD có sẵn (lưu ý tín hiệu ở đây là SMA, MT5 mặc định EMA nên phải tự tính). Dùng nến đã đóng của khung cao (shift ≥1) để tránh repaint. MACD đơn thuần là ý tưởng cũ; chỉ hữu ích làm bộ lọc hướng.
- Giấy phép: không điều khoản tái sử dụng rõ; công thức công khai.
**Vì sao đáng/không đáng thử:** chỉ làm bộ lọc xu hướng khung cao (đã đóng); không đáng thử làm hệ thống riêng.
