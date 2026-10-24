---
name: tv-sr-breaks-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/JDFoWQbL-Support-and-Resistance-Levels-with-Breaks-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong đầu mã; phi thương mại, chia sẻ tương tự) — chỉ lấy ý tưởng, không dùng lại mã
claim_by_source: mức hỗ trợ/kháng cự theo pivot; chỉ hiện các cú phá có khối lượng đáng kể để tránh nhiễu; không nêu số liệu hiệu quả
red_flags: [không có backtest, vẽ mức lùi về quá khứ (nhìn như biết trước), khối lượng vàng MT5 chỉ là tick volume, giấy phép NC-SA]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 5, 66.6K boost, Pine v4, 33 dòng, overlay.
Kháng cự = pivot high (cao nhất trong 15 bar trái và 15 bar phải), hỗ trợ = pivot low tương ứng; mức giữ đến khi có pivot mới. Tín hiệu phá: close cắt qua mức (lên qua kháng cự, xuống qua hỗ trợ) VÀ dao động khối lượng > 20, trong đó dao động = 100×(EMA5 volume − EMA10 volume)/EMA10 volume. Nhãn "B" khi nến không có râu ngược chiều đáng kể; nhãn "Bull/Bear Wick" khi nến phá có bóng râu lớn ngược hướng phá (cờ cảnh báo phá yếu).

**KIỂM LOGIC**
- Công thức: như trên; không có lệnh, chỉ nhãn và cảnh báo.
- Nến đóng hay đang hình thành: `crossover/crossunder(close, mức)` tính theo close hiện tại ⇒ nhãn trên nến realtime có thể hiện rồi mất; trên lịch sử là bản đã đóng. Cảnh báo (alert) không lọc điều kiện râu nến.
- Repaint/look-ahead: mức dùng `pivothigh(15,15)[1]` — chỉ biết sau 15 nến (pivot xác nhận trễ). Đường vẽ được lệch ngược (`offset = −(rightBars+1)`) về đúng vị trí pivot ⇒ nhìn lịch sử như mức "đã có từ lúc đỉnh hình thành"; tín hiệu phá thì dùng mức đã xác nhận nên không nhìn trước. Không dùng `security`.
- Tham số mặc định: left 15, right 15, ngưỡng khối lượng 20 (%), hiện nhãn phá bật.
- Điểm yếu: chỉ nhìn một pivot gần nhất (bỏ qua vùng nhiều lần chạm); độ trễ 15 nến; khối lượng ở vàng/CFD chỉ là tick volume (chất lượng khác sàn tập trung); phá giả (false break) nhiều trên vàng khi tin ra; không có SL/TP.
- Chuyển EA MT5 vàng: CÓ — pivot N trái/N phải xác nhận trễ N nến, lấy tick volume qua iVolume/CopyTickVolume, tất cả tính trên nến đóng. Cần kiểm chứng riêng giá trị của lọc khối lượng và lọc râu nến. Là biến thể breakout cơ bản; kiểm hypotheses/ xem breakout đã thử chưa.
- Giấy phép: CC BY-NC-SA ⇒ viết lại độc lập, không sao chép mã.
**Vì sao đáng thử:** sạch (không look-ahead ở tín hiệu), đơn giản, đo được tác dụng của lọc khối lượng; không đáng kỳ vọng edge nếu không có quản lý rủi ro và lọc phiên.
