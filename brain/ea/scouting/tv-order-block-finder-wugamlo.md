---
name: tv-order-block-finder-wugamlo
kind: scouting
source_url: https://www.tradingview.com/script/R8g2YHdg-Order-Block-Finder-Experimental/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong mã) — chỉ lấy ý tưởng, viết lại từ đầu
claim_by_source: đánh dấu "order block" tổ chức = nến ngược chiều cuối cùng trước chuỗi nến cùng chiều; tác giả nói rõ KHÔNG phải tín hiệu mua/bán, xác nhận trễ và "repaint theo định nghĩa", là vùng đáng quan tâm để đặt lệnh chờ; không số liệu
red_flags: [tác giả tự nhận repaint, xác nhận trễ N nến, giả định "tổ chức vào lệnh ở nến này" không chứng minh được, có bản V2 bán invite-only, lịch sử trông hoàn hảo là ảo giác theo lời tác giả]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 19, 40.8K boost, Editors' pick, Pine v4, 197 dòng, overlay. Bullish OB = nến giảm (close < open) đứng ngay trước một chuỗi đúng 5 nến tăng liên tiếp (tham số "Relevant Periods"), tùy chọn thêm điều kiện biến động giá từ close nến OB đến close nến cuối chuỗi ≥ ngưỡng % (mặc định 0). Vùng đánh dấu = từ open đến low của nến OB (hoặc toàn bộ high–low), kèm đường trung điểm. Bearish OB là phản chiếu. Các mức OB gần nhất được xuất ra data window để đặt cảnh báo khi giá chạm.

**KIỂM LOGIC**
- Công thức: nến thứ (periods+1) tính lùi từ nến hiện tại là ứng viên OB; nến 1..periods phải cùng chiều ngược lại (kiểm bằng close/open từng nến). Ngưỡng % tính trên close.
- Nến đóng hay đang hình thành: dùng close[1..5], không dùng nến hiện tại (nến [0] không tham gia vào chuỗi) ⇒ ổn định trên nến đóng; trên nến realtime cũng không đổi vì chỉ nhìn lùi các nến đã đóng… chính xác hơn: tín hiệu phát lúc nến [0] mở, dựa trên 5 nến đã đóng.
- Repaint/look-ahead: tác giả tự ghi "repaint theo định nghĩa": OB chỉ được biết SAU 5 nến, nhưng mã vẽ lùi bằng `offset = -ob_period` ⇒ trên đồ thị lịch sử OB hiện ngay tại nến gốc, trông như nhận diện real-time; thực tế báo muộn 5 nến. Không dùng `security`.
- Tham số mặc định: 5 nến, ngưỡng 0%, chỉ open–low/open–high, hiện kênh OB cuối.
- Điểm yếu: không có điều kiện bị lấp (mitigation) nên OB cũ tồn tại mãi, chỉ giữ OB gần nhất; chuỗi "đúng 5 nến cùng màu" rất hiếm trên khung nhỏ và không đo độ lớn nến; ngưỡng % không chuẩn hoá theo ATR; không SL/TP; khái niệm tổ chức không kiểm chứng.
- Chuyển EA MT5 vàng: CÓ, dễ — quy tắc thuần theo nến đóng, tất định, đặt lệnh chờ giới hạn tại vùng open–low. Phải đo trên dữ liệu độ trễ thật (tín hiệu xác nhận sau 5 nến) và thêm điều kiện hết hạn/bị lấp, SL theo ATR, ngưỡng biến động theo ATR. Lưu ý cảnh báo khung nhỏ vàng: chuỗi 5 nến cùng màu thường là cuối đà.
- Giấy phép: MPL 2.0 ⇒ viết lại.
**Vì sao đáng/không đáng thử:** đáng thử mức trung bình như giả thuyết "quay lại vùng nến ngược cuối trước đà" (retest limit) vì định nghĩa đơn giản, kiểm định được; cần so với thẻ tv-smc-luxalgo và tv-order-block-detector-luxalgo; coi cẩn thận ảo giác lịch sử do vẽ lùi.
