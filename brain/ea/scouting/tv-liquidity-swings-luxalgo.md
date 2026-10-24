---
name: tv-liquidity-swings-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/1S2VOnJP-Liquidity-Swings-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong mã) — phi thương mại; chỉ lấy ý tưởng, không chép mã
claim_by_source: tô vùng swing có hoạt động giao dịch, đếm số lần giá quay lại vùng và cộng dồn khối lượng; swing bị phá là dấu hiệu tăng (đỉnh) / giảm (đáy); tác giả nói rõ chỉ báo "không real-time", chỉ để phân tích mô tả
red_flags: [tự thừa nhận không dùng giao dịch real-time, pivot trễ, không backtest, "bị phá = tín hiệu" chưa được chứng minh]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 18, 41.2K boost, Pine v5, 222 dòng, overlay. Pivot cao/thấp xác nhận bằng 14 nến mỗi bên. Với mỗi pivot đỉnh, vùng = từ high đến max(open, close) của nến pivot ("Wick Extremity") hoặc đến low ("Full Range"); pivot đáy đối xứng. Từ khi vùng được xác nhận, mỗi nến mà khoảng low–high chạm vào vùng làm tăng bộ đếm 1 và cộng volume của nến (tuỳ chọn dùng nến 1 phút bên trong để tính volume). Vùng chỉ hiện khi đếm/volume vượt ngưỡng lọc (mặc định 0). Vùng đỉnh coi là bị phá khi close > cận trên; vùng đáy khi close < cận dưới; khi bị phá thì đường kẻ chuyển nét đứt và vùng ngừng kéo dài.

**KIỂM LOGIC**
- Công thức: như trên; chỉ giữ MỘT vùng đỉnh và MỘT vùng đáy gần nhất làm trạng thái chạy, vùng cũ chỉ còn ở dạng hình vẽ.
- Nến đóng hay đang hình thành: việc phá dùng close nến hiện tại, không chặn `barstate.isconfirmed` ⇒ trên nến realtime có thể đổi trạng thái rồi trở lại.
- Repaint/look-ahead: pivot trễ 14 nến và toàn bộ vùng/nhãn hiện lùi 14 nến (tác giả tự ghi "hiển thị hồi tố"); bộ đếm dùng giá trị trễ `[length]` nên chạm trong 14 nến đầu sau pivot được tính ngầm khi vùng được xác nhận ⇒ đồ thị lịch sử cho thấy vùng "đã có" ngay từ đỉnh. Dùng `request.security_lower_tf` (khung 1 phút) cho volume: có thể thiếu dữ liệu lịch sử xa, khác nhau theo gói tài khoản. Không nhìn trước giá tương lai khác.
- Tham số mặc định: pivot 14, vùng Wick Extremity, lọc theo Count ngưỡng 0, intrabar tắt.
- Điểm yếu: chỉ xử lý một vùng mỗi phía; "đếm lần quay lại" khuyến khích vùng cũ bị chạm nhiều (vùng yếu đi sau mỗi lần chạm); volume là tick volume trên vàng CFD; không có quy tắc vào/SL; "phá đỉnh = tăng" chống lại giả thuyết quét thanh khoản (giá quét đỉnh rồi đảo chiều).
- Chuyển EA MT5 vàng: CÓ một phần — vùng swing + phá bằng close nến đóng triển khai được (tất định); phần volume intrabar thì không cần. Nên coi là biến thể quét thanh khoản/sweep hơn là "phá đỉnh = mua"; cần thử cả hai hướng (theo phá hoặc đảo chiều sau quét) và trùng ý với thẻ tv-smc-luxalgo.
- Giấy phép: CC BY-NC-SA 4.0.
**Vì sao đáng/không đáng thử:** không đáng làm chiến lược riêng (chưa có tín hiệu giao dịch, tác giả nói không để giao dịch); đáng ghi là nguồn cho giả thuyết "vùng đỉnh/đáy bị chạm nhiều lần rồi bị quét" để ea-mo-xe kiểm.
