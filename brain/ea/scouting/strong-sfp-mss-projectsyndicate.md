---
name: strong-sfp-mss-projectsyndicate
kind: scouting
source_url: https://www.tradingview.com/script/C0ePp0aq-Strong-SFP-MSS-ProjectSyndicate/
fetched_at: 2026-10-24
license: không ghi giấy phép trong mã (áp dụng mặc định House Rules của TradingView) — chỉ lấy ý tưởng
claim_by_source: Phân loại ba kiểu phản ứng của giá với thanh khoản (SWEEP, SFP, MSS), chấm sức mạnh 0–10, bảng thống kê tỷ lệ thắng tự tính trên chính tín hiệu. Mã 1086 dòng, đọc được ~2/3 (phần còn lại là bảng hiển thị).
red_flags: [repaint (pivot xác nhận trễ 10 nến; mức chỉ được tạo nếu giá chưa phá trong 10 nến đó), thống kê WIN% nội bộ tính trên tín hiệu của chính nó với mục tiêu 1,5R và dừng cấu trúc — không có phí/spread/trượt giá, không phải kết quả backtest độc lập, request.security dùng lookahead_on nhưng với [1] (đúng cách, không nhìn trước), điểm sức mạnh là trọng số tự đặt dễ overfit, tín hiệu timeout bị tính là không thắng, mã rất phức tạp]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, không chép code):**
- Mức thanh khoản = đỉnh/đáy xoay (cửa sổ 10), gộp các đỉnh/đáy gần nhau (≤0,25 ATR) thành "bể"; tối đa 5 mức mỗi phía; thêm đỉnh/đáy ngày và tuần trước.
- Sau khi giá chạm mức, chỉ xét trên nến đã đóng, ba trạng thái:
  - SWEEP: râu vượt mức nhưng cùng nến đóng lại bên trong.
  - SFP: đóng cửa xuyên qua mức (trạng thái "pierced"), sau đó một nến đóng lại bên trong → luận điểm đảo chiều.
  - MSS: đóng xuyên qua và được chấp nhận (nến sau tiếp tục cùng hướng, hoặc quá 6 nến vẫn ở phía kia) → luận điểm tiếp diễn.
- Điểm 0–10 = 40% điểm mức (phiên tạo ra, số lần chạm, khối lượng, râu từ chối) + độ sâu quét + khối lượng nến + thân nến. Chỉ tín hiệu ≥3 điểm được theo dõi.
- Quản lý lệnh mô phỏng: vào ở giá đóng; SL cấu trúc = khoảng cách tới cực trị quét + 0,15 ATR (sàn 0,5 ATR); TP = 1,5R; nếu một nến chạm cả SL và TP thì tính SL trước (bảo thủ); hết 60 nến là timeout.

**Vì sao đáng/không đáng thử:** Đáng: phân biệt rõ SWEEP (đảo chiều tức thì) / SFP (đảo chiều có xác nhận) / MSS (tiếp diễn) giúp thiết kế hai nhánh giả thuyết đối nghịch; quy ước "SL trước nếu cùng nến" đáng giữ cho EA. Không nên tin các con số thắng/thua trong bảng. Nếu thử: bắt đầu với riêng nhánh SFP trên nến đóng, mức = đỉnh/đáy ngày hôm trước, SL = cực trị quét + đệm ATR, so sánh với nhánh MSS tiếp diễn; chống overfit bằng out-of-sample, không dùng điểm sức mạnh nhiều trọng số.
