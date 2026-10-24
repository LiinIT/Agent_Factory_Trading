---
name: tv-signals-overlays-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/fYHlrAoz-LuxAlgo-Signals-Overlays/
fetched_at: 2026-10-24
license: INVITE-ONLY (protected) — mã ẩn, truy cập trả phí qua tác giả; không dùng lại, chỉ ghi mô tả công khai
claim_by_source: bộ công cụ hơn 20 tính năng gồm tín hiệu xác nhận/ngược xu hướng (thường và mạnh), dấu thoát, lớp phủ (Smart Trail, Reversal Zones, Trend Catcher, Trend Tracer, Neo Cloud), bảng điều khiển, bộ phân loại tín hiệu bằng học máy "đơn giản" 4 mức, tối ưu độ nhạy bằng grid search; không có số liệu lợi nhuận
red_flags: [protected, không đọc được mã, bán bot/đăng ký trả phí, không có backtest công khai, tối ưu độ nhạy bằng grid search trên lịch sử dễ overfit, tác giả tự nói tín hiệu "không nên theo mù quáng", changelog dài thay đổi thuật toán liên tục (lịch sử tín hiệu có thể không còn là bản đang chạy)]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, chỉ từ mô tả công khai):** hạng 16, 44.5K boost, Pine ẩn, đăng từ 2020, cập nhật đến 10/2025. Tín hiệu mua/bán theo xu hướng cộng lớp phủ hỗ trợ/kháng cự động; bộ lọc cho phép chỉ giữ tín hiệu cùng hướng với Smart Trail hoặc với chỉ số sức mạnh xu hướng.

**KIỂM LOGIC**
- Không kiểm được: mã invite-only, không bịa công thức. Ghi nhận từ changelog: có thời kỳ tác giả thêm cờ chỉ dùng giá đóng thật và sửa lỗi cảnh báo bắn mỗi nến thay vì khi nến đóng (06/2025) ⇒ bản cũ có khả năng báo trên nến đang chạy; thuật toán tín hiệu đổi nhiều lần ⇒ không thể đối chiếu lịch sử.
- Tham số mặc định: không rõ; độ nhạy do "Optimal Sensitivity" gợi ý bằng grid search.
- Điểm yếu: hộp đen, không tái lập; tối ưu tham số trên lịch sử; muốn dùng phải trả phí.
- Chuyển EA MT5 vàng: KHÔNG — không có mã, không diễn đạt lại được; những khối đã nhắc (trailing kiểu Smart Trail, bộ lọc sức mạnh xu hướng) đã có ở thẻ khác (SuperTrend, UT Bot, ADX).
- Giấy phép: mã đóng, thương mại.
**Vì sao đáng/không đáng thử:** không đáng — không đọc được và có tính quảng bá; chỉ ghi để loại khỏi danh sách.
