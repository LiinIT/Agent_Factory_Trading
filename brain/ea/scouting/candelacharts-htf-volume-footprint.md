---
name: candelacharts-htf-volume-footprint
kind: scouting
source_url: https://www.tradingview.com/script/GP7MoZCA-CandelaCharts-HTF-Volume-Footprint/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 — chỉ lấy ý tưởng, viết lại từ đầu
claim_by_source: Vẽ nến khung lớn kèm "footprint" bid×ask từng mức giá, POC và vùng giá trị 70% (VAH/VAL); gợi ý mua ở VAL, bán ở VAH, hồi về POC. Không có backtest.
red_flags: [bid/ask là ước lượng (nến khung nhỏ tăng = mua, giảm = bán; khối lượng chia theo phần chồng lấn giá), không phải dữ liệu tick thật — "footprint" giả định, gần như vô dụng trên khối lượng tick của CFD/forex, nến khung lớn cuối cùng đang hình thành nên POC/VAH/VAL của nến hiện tại thay đổi liên tục (repaint theo thời gian thực), phụ thuộc request.security_lower_tf (giới hạn dữ liệu lịch sử), indicator trực quan không có luật vào/ra, tác giả quảng cáo sản phẩm trả phí]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, không chép code):**
- Với mỗi nến khung lớn (ngày/tuần), gom các nến 1 phút bên trong, chia khoảng giá [thấp, cao] thành 10–60 ô bằng nhau.
- Khối lượng mỗi nến phút được rải vào các ô theo tỷ lệ chồng lấn giữa dải giá nến và ô; nến tăng tính hết là mua, nến giảm tính hết là bán, nến doji chia đôi.
- POC = ô có tổng khối lượng cao nhất. Vùng giá trị: mở rộng từ POC lên/xuống, mỗi bước thêm ô bên có khối lượng lớn hơn, dừng khi tích luỹ ≥70% tổng khối lượng; VAH/VAL = cạnh trên/dưới.
- Cách dùng đề xuất: VAL/VAH là vùng phản ứng mean-reversion về POC; hai nến đóng ngoài vùng giá trị = giá trị dịch chuyển (chấp nhận), còn thăm dò bị từ chối quay lại trong = xoay về cực đối diện.

**Công thức tách được:** VA = tập ô liền kề chứa POC với tổng ≥ 0,7 × tổng khối lượng, mở rộng dần về phía lớn hơn.

**Vì sao đáng/không đáng thử:** Đáng một phần: bộ ba POC/VAH/VAL của phiên/ngày trước tính bằng nến M1 là mức tham chiếu không repaint khi nến ngày đã đóng, dễ làm EA (mean-reversion trong vùng giá trị, breakout khi 2 nến đóng ngoài). Không đáng: phần "footprint bid×ask" trong MT5 chỉ là xấp xỉ từ tick volume; bỏ qua phần hiển thị. Nếu thử: dùng nến ngày đã đóng, M1/M5 tick-volume, kiểm tra riêng khả năng dự báo của mức VA so với mức đỉnh/đáy ngày hôm trước.
