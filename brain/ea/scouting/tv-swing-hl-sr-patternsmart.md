---
name: tv-swing-hl-sr-patternsmart
kind: scouting
source_url: https://www.tradingview.com/script/RQnLfaNE-Swing-high-low-support-resistance/
fetched_at: 2026-10-24
license: PROTECTED — mã đóng, TradingView cho dùng miễn phí nhưng không cho xem/tái sử dụng mã; chỉ ghi mô tả công khai
claim_by_source: vẽ các điểm swing cao/thấp theo số nến mỗi bên (swing length) để làm mốc hỗ trợ/kháng cự, dừng lỗ, chốt lời; nêu phân kỳ khi chỉ báo không tạo đỉnh mới mà giá tạo; không có số liệu
red_flags: [protected, không đọc được mã, không kiểm được công thức, không có backtest]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, chỉ từ mô tả công khai):** hạng 13, 45.8K boost, Pine v4 theo ghi chú. Đánh dấu swing cao/thấp bằng số nến mỗi bên (kiểu pivot xác nhận), nguồn có thể là open/high/low/close/hl2/hlc3/ohlc4/hlcc4; có cảnh báo khi swing hình thành (thêm 02/2025).

**KIỂM LOGIC**
- Không kiểm được: mã protected, không bịa công thức. Chỉ suy từ mô tả rằng swing cần nến phải mỗi bên nên xác nhận trễ bằng swing length; chưa rõ nến đóng hay đang hình thành, chưa rõ repaint.
- Tham số mặc định: không biết (không đọc được).
- Điểm yếu: chỉ có swing, không có quy tắc vào/ra; không tái lập được từ nguồn này.
- Chuyển EA MT5 vàng: KHÔNG từ nguồn này (không có mã); khái niệm swing pivot đã có ở các thẻ khác (tv-sr-channels-lonesometheblue, tv-trendlines-breaks-luxalgo) nên không cần.
- Giấy phép: mã đóng; không dùng lại.
**Vì sao đáng/không đáng thử:** không đáng — không đọc được, không thêm ý mới so với pivot chuẩn.
