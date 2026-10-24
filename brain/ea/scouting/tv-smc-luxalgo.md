---
name: tv-smc-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/CnB3fSph-Smart-Money-Concepts-SMC-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong đầu mã; phi thương mại, chia sẻ tương tự) — chỉ lấy ý tưởng, không dùng lại mã
claim_by_source: tự động đánh dấu cấu trúc thị trường (BOS/CHoCH nội bộ và swing), order block, EQH/EQL, FVG, vùng premium/discount; chính tác giả nói không có dữ liệu chứng minh các khái niệm SMC đúng
red_flags: [không có backtest/số liệu lợi nhuận, khái niệm SMC chưa kiểm chứng, repaint nội nến ở thời gian thực, look-ahead trong FVG đa khung, giấy phép NC-SA]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 1, 175.9K boost, Pine v5, mã mở (848 dòng).
Đỉnh/đáy swing xác định bằng "chân" (leg): nến cách đây `size` bar có cao hơn mọi nến sau nó ⇒ chân giảm bắt đầu (đỉnh được ghi nhận); thấp hơn mọi nến sau ⇒ chân tăng. Ba cỡ: swing 50, nội bộ 5, EQH/EQL 3. Giá đóng vượt đỉnh chưa bị vượt ⇒ BOS nếu xu hướng đang cùng chiều, CHoCH nếu đang ngược chiều. Order block = nến có biên độ cực trị (cao nhất/thấp nhất) giữa pivot và nến phá cấu trúc, nến biến động ≥ 2×ATR(200) bị đảo high/low để lọc; bị xoá khi giá (high/low hoặc close) xuyên qua. EQH/EQL: hai pivot lệch nhau < 0.1×ATR(200). FVG: low nến hiện tại > high cách 2 nến và thân nến giữa lớn hơn ngưỡng tự động (trung bình tích luỹ ×2). Premium/Discount: khoảng giữa đỉnh và đáy swing gần nhất, vùng 5% trên/dưới và cân bằng 50%.

**KIỂM LOGIC**
- Công thức: như trên; không có tín hiệu vào/ra, chỉ vẽ.
- Nến đóng hay đang hình thành: điều kiện BOS/CHoCH dùng `crossover(close, mức)` không chặn bằng nến đã đóng ⇒ trên nến realtime nhãn có thể hiện rồi biến mất khi close đổi; trên lịch sử thì dùng close đã đóng.
- Repaint/look-ahead: (1) pivot xác nhận trễ `size` bar (50 bar cho swing) nên mức "đã biết" chỉ biết sau 50 nến; nhưng nhãn vẽ ở thời điểm lùi lại ⇒ nhìn lịch sử thấy như tiên đoán. (2) Order block tìm lại ngược từ pivot tới nến phá, chỉ biết khi phá xảy ra. (3) FVG gọi `request.security` với `lookahead_on` lấy cả high/low nến hiện tại của khung cao ⇒ nhìn trước tương lai trên lịch sử. (4) Mức cao/thấp D/W/M dùng `[1]` + lookahead_on (dạng an toàn).
- Tham số mặc định: swing 50, nội bộ 5, EQ confirm 3, ngưỡng EQ 0.1, OB lọc ATR, mitigation High/Low, 5 OB hiển thị; FVG, Premium/Discount, swing OB, MTF tắt sẵn.
- Điểm yếu: không có quy tắc giao dịch; nhiều cấu hình chủ quan; nhãn vẽ muộn; chạy nặng (mảng lớn); khái niệm OB/FVG chưa có bằng chứng thống kê.
- Chuyển EA MT5 vàng: CÓ THỂ một phần — BOS/CHoCH theo pivot trễ và FVG 3 nến tính được trên nến đóng, không repaint nếu tự viết lại có xác nhận N bar; OB/premium-discount cần định nghĩa lại. Phải coi là giả thuyết cần backtest, không phải ý tưởng đã có edge.
- Giấy phép: CC BY-NC-SA 4.0 ⇒ viết lại từ ý tưởng, không sao chép.
**Vì sao đáng thử:** làm bộ lọc cấu trúc (BOS/CHoCH) cho EA; thử với giả thuyết riêng, so sánh với bản không lọc. Không đáng thử nguyên khối "SMC".
