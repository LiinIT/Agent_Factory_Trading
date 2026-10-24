---
name: dynamic-liquidity-clouds-bigbeluga
kind: scouting
source_url: https://www.tradingview.com/script/HaXiJL7z-Dynamic-Liquidity-Clouds-BigBeluga/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (phi thương mại, chia sẻ tương tự) — chỉ lấy ý tưởng, không chép mã
claim_by_source: Vẽ vùng thanh khoản BSL/SSL quanh đỉnh/đáy xoay, co giãn theo khối lượng; đánh dấu khi bị quét; gợi ý quét thường báo hiệu đảo chiều. Không có backtest.
red_flags: [repaint (pivot cần pivotLength nến bên phải mới xác nhận, mốc vẽ lùi 5 nến), look-ahead (không dùng request.security; đỉnh/đáy chỉ biết trễ), indicator không phải strategy (không có tín hiệu vào lệnh, không PnL/DD), tuyên bố "quét thường đảo chiều" không bằng chứng, tác giả quảng bá kênh trả phí]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, không chép code):**
- Đỉnh xoay (cửa sổ 5 nến mỗi bên) = thanh khoản phía mua nằm trên đỉnh; đáy xoay = thanh khoản phía bán nằm dưới đáy.
- Quanh mỗi mức dựng 6 lớp hộp xếp chồng, mỗi lớp cao = 0,1 × ATR(14), cách mức ban đầu theo bậc thang; lớp ngoài cùng cách mức khoảng 12 bước.
- Bề rộng ngang tỷ lệ với khối lượng cộng trong 11 nến quanh pivot, chuẩn hoá theo min–max 100 nến gần nhất (tối đa 100 nến); khối lượng lớn → rộng và đậm hơn.
- Quét: giá đóng cửa (hoặc râu, tuỳ chọn) vượt mép ngoài cùng khi còn trong bề rộng của hộp → đánh dấu đã quét. Chỉ giữ 60 mức mỗi phía.

**Công thức tách được:** pivot = đỉnh/đáy cực trị trong ±5 nến; mép ngoài BSL = đỉnh + 0,1·ATR·12; mép ngoài SSL = đáy − 0,1·ATR·12; điều kiện quét BSL: giá (close/high) > mép ngoài; SSL: giá (close/low) < mép ngoài.

**Vì sao đáng/không đáng thử:** Đáng như bộ lọc bối cảnh: "mức đỉnh/đáy xoay chưa bị quét + khối lượng cao" làm mục tiêu hoặc vùng đảo chiều sau quét. Không đáng thử một mình: chưa có luật vào/ra, hộp rộng 12 bước ATR nhỏ nên quét gần như chắc xảy ra. Nếu thử: dùng đỉnh/đáy đã xác nhận (trễ 5 nến), vào lệnh bằng nến đóng sau quét, đặt lại điều kiện "quét thất bại" (đóng lại trong vùng).
