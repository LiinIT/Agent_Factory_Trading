---
name: tv-sessions-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/bkb6vZDz-Sessions-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong mã) — phi thương mại; chỉ lấy ý tưởng, không chép mã
claim_by_source: hiển thị khoảng giá, đường xu hướng, trung bình, VWAP theo phiên người dùng đặt (tối đa 4 phiên), kèm bảng thống kê; tác giả nói kém chính xác khi khung lớn hơn H1; không có số liệu lợi nhuận
red_flags: [không phải hệ thống giao dịch (không có tín hiệu vào/ra), không backtest, dùng volume sàn làm VWAP]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 17, 43.2K boost, Pine v6, 504 dòng, overlay (công cụ hiển thị). Bốn phiên mặc định theo giờ UTC: New York 13:00–22:00, London 07:00–16:00, Tokyo 00:00–09:00, Sydney 21:00–06:00. Với mỗi phiên theo dõi: cao/thấp luỹ kế trong phiên (vẽ hộp), trung bình số học của close, hồi quy tuyến tính của close theo thứ tự nến (đường + hệ số tương quan + độ lệch chuẩn), VWAP luỹ kế = Σ close×volume / Σ volume, và tuỳ chọn kéo dài cao/thấp của phiên đã kết thúc tới phiên kế tiếp.

**KIỂM LOGIC**
- Công thức: như trên; phiên hoạt động xác định bằng hàm `time(timeframe, session, timezone)` khác na; toàn bộ là thống kê luỹ kế theo từng nến trong phiên.
- Nến đóng hay đang hình thành: trên nến realtime hộp/giá trị phiên cập nhật liên tục theo nến chưa đóng; cao/thấp phiên mở rộng dần. Lịch sử là bản đã đóng. Không có tín hiệu nên không bật/tắt tín hiệu.
- Repaint/look-ahead: không dùng `security`, không pivot; không nhìn trước. Cao/thấp phiên chỉ biết tại cuối phiên (đúng, không giả). Mức "Max/Min kéo dài" chỉ dùng sau khi phiên kết thúc nên hợp lệ.
- Tham số mặc định: 4 phiên như trên, UTC+0, bảng tắt, đường kẻ ngày bật.
- Điểm yếu: giờ phiên cố định không điều theo giờ mùa hè (DST) của London/New York, cần chỉnh khi dùng giờ sàn; volume forex/vàng CFD là tick volume nên VWAP không chuẩn; phiên chồng lấn nhau (London/New York); không có quy tắc giao dịch.
- Chuyển EA MT5 vàng: CÓ, như bộ lọc/ngữ cảnh — cao/thấp phiên Á, mốc giờ London/NY mở cửa dễ tính từ nến đóng (`iHigh/iLow` theo cửa sổ giờ máy chủ, cần quy đổi giờ máy chủ broker). Dùng làm mức tham chiếu cho chiến lược "phá biên phiên Á" hoặc lọc giờ; bản thân chỉ báo không phải ý tưởng giao dịch. Hợp với vàng vì biến động tập trung theo phiên.
- Giấy phép: CC BY-NC-SA 4.0.
**Vì sao đáng/không đáng thử:** không đáng thử như hệ thống; đáng dùng như khối ngữ cảnh (biên phiên Á, lọc giờ) cho ý tưởng khác, kết hợp thẻ tv-ict-killzones-pivots-tfo; cần đối chiếu hypotheses/ trước khi thử (giờ giao dịch).
