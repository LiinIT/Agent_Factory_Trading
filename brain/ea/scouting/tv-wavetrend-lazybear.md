---
name: tv-wavetrend-lazybear
kind: scouting
source_url: https://www.tradingview.com/script/2KE8wTuF-Indicator-WaveTrend-Oscillator-WT/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (House Rules; đầu mã xin tác giả "nhắn lại" nếu dùng — là lời nhờ, không phải điều khoản); công thức là bản chuyển của chỉ báo TradeStation/MT cũ — chỉ lấy ý tưởng
claim_by_source: cắt xuống tín hiệu khi trên vùng quá mua là "thường là tín hiệu BÁN tốt", cắt lên khi dưới vùng quá bán là tín hiệu MUA tốt; không số liệu
red_flags: [không có backtest, tuyên bố "thường tốt" không số liệu, chọn ví dụ có lợi trên hình, dao động đối đầu xu hướng mạnh]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 8, 61.2K boost, Pine v1 (2014), 31 dòng, dao động.
Giá tham chiếu hlc3. esa = EMA10(hlc3). d = EMA10(|hlc3 − esa|). ci = (hlc3 − esa)/(0.015×d) (dạng CCI dùng EMA thay trung bình đơn giản). wt1 = EMA21(ci); wt2 = SMA4(wt1). Vùng quá mua ±60/±53. Tín hiệu mô tả: wt1 cắt xuống wt2 khi đang trên vùng quá mua = bán; cắt lên dưới vùng quá bán = mua. Vùng chênh wt1−wt2 vẽ dạng diện tích.

**KIỂM LOGIC**
- Công thức: như trên; không có lệnh, tín hiệu chỉ nằm ở lời mô tả.
- Nến đóng hay đang hình thành: dùng hlc3 (gồm close) hiện tại ⇒ giá trị cuối nến mới cố định; trong nến realtime, wt1 và điểm cắt nhấp nháy.
- Repaint/look-ahead: KHÔNG `security`, KHÔNG pivot ⇒ không nhìn trước, không vẽ lại lịch sử; chỉ nhấp nháy nội nến.
- Tham số mặc định: kênh 10, trung bình 21, quá mua 60/53, quá bán −60/−53, tín hiệu SMA4.
- Điểm yếu: dao động đối đầu xu hướng — trong xu hướng mạnh vùng quá mua/quá bán kéo dài, bắt đỉnh/đáy sớm liên tục; trễ vì EMA lồng EMA; ngưỡng ±60 cố định không theo biến động; không có SL/TP.
- Chuyển EA MT5 vàng: CÓ — tính hoàn toàn trên nến đóng bằng hlc3 và EMA; dễ viết và kiểm. Hợp mean-reversion trong nhịp đi ngang của vàng, nguy hiểm khi vàng chạy xu hướng/tin; cần lọc chế độ (ADX hoặc ATR). Kiểm trước hypotheses/ xem mean-reversion dao động đã thử và bị bác chưa.
- Giấy phép: không điều khoản tái sử dụng rõ; công thức công khai.
**Vì sao đáng/không đáng thử:** đáng thử làm bộ lọc vào lệnh đảo chiều có lọc xu hướng; không đáng thử độc lập.
