---
name: amd-range-arleay
kind: scouting
source_url: https://www.tradingview.com/script/tr7I2KZL-AMD-Range/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 — chỉ lấy ý tưởng, viết lại từ đầu
claim_by_source: Đánh dấu chuỗi tích luỹ → thao túng (quét) → phân phối (Power of Three); vào lệnh khi nến đóng quay lại trong vùng; mô hình mô phỏng từ một video, không có backtest. Tác giả nói rõ nhiều tham số "không có trong nguồn".
red_flags: [không có backtest hay DD, nhiều tham số tự đặt (range 8–60 nến, drift 50%, thân nến ≥0,8 ATR, hết hạn 30/60 phút) dễ overfit, nhận diện range theo luật xấp xỉ, chỉ chạy khung ≤15 phút và theo giờ New York, nghi lệ thuộc hợp đồng tương lai (qty theo pointvalue), vào lệnh tại giá đóng nến đã xác nhận (không repaint nhưng không mô phỏng khớp limit)]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại, không chép code):**
1. Tích luỹ: tìm đoạn nến liền nhau (≥8, tối đa 60) có chiều cao ≤5×ATR(14) và dịch chuyển ròng đóng cửa <50% chiều cao.
2. Thao túng: nến hiện tại phá một phía của range (không phá cả hai) → cực trị quét là mức dừng lỗ. Quét xuống kỳ vọng lên và ngược lại. Một nến đóng quay lại trong range, theo hướng đảo, thân ≥0,8 ATR mới "armed"; đóng xuyên phía đối diện hoặc quá 30 phút → huỷ.
3. Vào lệnh (trong 60 phút sau khi quay lại): Inversion = đóng cửa vượt qua khoảng trống (FVG ba nến) ngược hướng hình thành từ lúc quét; hoặc Retest = chạm lại mép bị quét và đóng giữ được. Vào ở giá đóng nến đó; SL = cực trị quét.
4. Mục tiêu: 2R, hoặc thanh khoản swing chưa bị lấy, hoặc 2/4 độ lệch chuẩn của chân thao túng; tuỳ chọn dời SL về hoà vốn sau TP1.
5. Bộ lọc tuỳ chọn: quét phải vượt giá mở nến PO3 (ngày theo giờ NY).

**Vì sao đáng/không đáng thử:** Đáng: là một chuỗi luật hoàn chỉnh, xác định được, dùng nến đóng nên dễ chuyển EA không repaint; thuộc họ "quét thanh khoản + đảo chiều + FVG". Rủi ro: nhiều ngưỡng tự đặt → cần walk-forward; nên thử trên XAUUSD/chỉ số M5 với SL cố định theo cực trị quét, đối chiếu có/không bộ lọc giá mở ngày. Kiểm tra trước trong `hypotheses/` các giả thuyết quét thanh khoản đã bác bỏ.
