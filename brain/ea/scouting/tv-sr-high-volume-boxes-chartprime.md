---
name: tv-sr-high-volume-boxes-chartprime
kind: scouting
source_url: https://www.tradingview.com/script/Uz2AJ0i4-Support-and-Resistance-High-Volume-Boxes-ChartPrime/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong mã) — chỉ lấy ý tưởng, viết lại từ đầu
claim_by_source: hộp hỗ trợ/kháng cự dựng từ pivot kèm khối lượng, kim cương "giữ" là cơ hội mua/bán tiềm năng, nhãn "Break Sup/Res"; không nêu số liệu
red_flags: [không có backtest, "khối lượng" là tick volume dạng delta thô, tín hiệu hold chỉ là gợi ý thị giác, bản đăng thông điệp tiếp thị]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 15, 45.1K boost, Pine v5, 207 dòng, overlay. Pivot cao/thấp theo close với 20 nến mỗi bên (`pivothigh(close,20,20)`). "Volume delta" mỗi nến = +volume nếu nến lên, −volume nếu nến xuống (nến doji giữ hướng cũ); ngưỡng = cực đại/cực tiểu của delta/2.5 trong 2 nến gần nhất. Hộp hỗ trợ tạo khi có pivot thấp VÀ delta nến lúc xác nhận vượt ngưỡng trên; hộp kháng cự khi pivot cao VÀ delta dưới ngưỡng dưới. Hộp rộng 1×ATR(200) tính từ mức pivot, kéo dài sang phải đến hộp mới cùng loại. Phá kháng cự = low cắt lên qua đỉnh hộp; phá hỗ trợ = high cắt xuống qua đáy hộp; "giữ" = high cắt xuống qua cận kháng cự / low cắt lên qua cận hỗ trợ. Vai trò đảo (kháng cự bị phá thành hỗ trợ) được theo dõi bằng cờ.

**KIỂM LOGIC**
- Công thức: như trên; hộp chỉ hiện khi cùng lúc có pivot xác nhận và khối lượng lệch cực đoan.
- Nến đóng hay đang hình thành: các cắt dùng high/low nến hiện tại, không chặn `barstate.isconfirmed` ⇒ trên nến realtime tín hiệu giữ/phá có thể bật rồi mất khi high/low đổi. Ký hiệu kim cương vẽ lệch −1 nến.
- Repaint/look-ahead: pivot xác nhận trễ 20 nến, nhưng hộp vẽ từ nến pivot (lùi 20 nến) đến nay ⇒ trên lịch sử hộp trông như có sẵn từ đúng đỉnh/đáy trước khi được biết. Tín hiệu hold/break tính bằng giá hiện tại nên không nhìn trước. Không dùng `security`.
- Tham số mặc định: lookback 20, lọc volume 2, độ rộng hộp ×1 (ATR 200).
- Điểm yếu: điều kiện "delta" chỉ đúng khi volume tin cậy; trên vàng MT5 broker chỉ có tick volume, khác nhau giữa broker; pivot 20 nến rất trễ; hộp chỉ xuất hiện hiếm; "giữ" bằng cắt high/low dễ bắn ở nhiều nến liên tiếp; vai trò đảo dùng cờ toàn cục dễ lệch trạng thái; không SL/TP.
- Chuyển EA MT5 vàng: CÓ nhưng yếu — logic tất định trên nến đóng được; cần dùng tick volume (kém tin cậy) và kiểm xem điều kiện volume có thêm lợi thế hay chỉ làm hiếm tín hiệu. Nên thử bản bỏ volume (chỉ pivot + ATR) để so.
- Giấy phép: MPL 2.0 ⇒ viết lại.
**Vì sao đáng/không đáng thử:** ý "đảo vai khi phá + retest hộp ATR" có thể ghép với tv-sr-channels-lonesometheblue; phần volume là giả thuyết chưa chứng minh. Đáng thử ở mức thấp, ưu tiên sau các ý đã có nền.
