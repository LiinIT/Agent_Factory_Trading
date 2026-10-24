---
name: tv-trendlines-breaks-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/IYL88A1N-Trendlines-with-Breaks-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong mã) — phi thương mại, chia sẻ tương tự; chỉ lấy ý tưởng, không chép mã
claim_by_source: trendline dựng từ pivot kèm điểm phá; tác giả nói điểm phá "thời gian thực, không backpaint", đường có thể repaint nếu bật backpaint; không nêu số liệu lợi nhuận
red_flags: [không có backtest, đường vẽ lùi length nến theo mặc định, phân tích tay hơn là hệ thống]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 11, 53.5K boost, Pine v5, 96 dòng, overlay. Mỗi khi xuất hiện pivot cao (hoặc thấp) xác nhận bằng length nến mỗi bên, dựng đường dốc xuống (hoặc lên) xuất phát từ pivot đó. Độ dốc mỗi nến = chỉ số biến động / length × hệ số, chỉ số là ATR, độ lệch chuẩn close hoặc độ dốc hồi quy tuyến tính. Điểm phá: close vượt đường dốc xuống (mua) hoặc thủng đường dốc lên (bán); cờ phá được xoá khi có pivot mới.

**KIỂM LOGIC**
- Công thức: như trên; đường đi giảm đều theo độ dốc đã chốt tại pivot gần nhất, giá trị đường tại nến hiện tại = mức pivot trừ dốc × (số nến từ pivot).
- Nến đóng hay đang hình thành: so sánh close hiện tại với đường, không chặn `barstate.isconfirmed` ⇒ trên nến realtime nhãn B có thể xuất hiện rồi mất khi close đổi; trên lịch sử là bản đã đóng.
- Repaint/look-ahead: pivot dùng `pivothigh(length, length)` nên pivot chỉ biết sau length nến (trễ mặc định 14 nến). Mặc định backpaint = bật: đường được dịch lùi length nến, nhìn trên lịch sử như đã biết pivot ngay tại đỉnh ⇒ đẹp giả. Nhãn B tính từ mức trễ đúng nên không nhìn trước. Không dùng `security`.
- Tham số mặc định: length 14, dốc ×1, phương pháp ATR, backpaint bật.
- Điểm yếu: pivot trễ 14 nến nên đường dựng muộn; dốc ATR/length quá nhỏ ⇒ gần như đường ngang; nhiều cú phá giả khi đi ngang; không có SL/TP, không xét khung lớn; chia sẻ cờ phá chỉ đặt lại ở pivot mới.
- Chuyển EA MT5 vàng: CÓ, nhưng chỉ phần logic nến đóng (pivot trễ + đường dốc + phá bằng close nến đã đóng); bỏ backpaint. Cần lọc retest hoặc xu hướng khung lớn và SL theo ATR vì vàng nhiều phá giả. Kiểm hypotheses/ trước khi thử.
- Giấy phép: CC BY-NC-SA 4.0 ⇒ không dùng lại mã trong sản phẩm thương mại; viết lại từ ý tưởng.
**Vì sao đáng/không đáng thử:** ý tưởng "phá đường xu hướng dốc" đơn giản, tất định, dễ kiểm nghiệm; nhưng chưa có bằng chứng lợi thế và trùng họ phá hỗ trợ/kháng cự (tv-sr-breaks-luxalgo). Đáng thử ở mức một biến thể.
