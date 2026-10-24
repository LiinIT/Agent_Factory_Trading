---
name: tv-sr-channels-lonesometheblue
kind: scouting
source_url: https://www.tradingview.com/script/Ej53t8Wv-Support-Resistance-Channels/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong mã) — copyleft mức tệp; chỉ lấy ý tưởng, viết lại từ đầu
claim_by_source: tự tìm các vùng hỗ trợ/kháng cự mạnh nhất từ pivot, báo khi vùng bị phá; không nêu số liệu lợi nhuận
red_flags: [không có backtest, vùng đổi khi có pivot mới, tác giả quảng bá khoá học và bản trả phí]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 12, 48K boost, Editors' pick, Pine v6, 192 dòng, overlay. Giữ danh sách pivot cao/thấp (chu kỳ 10 mỗi bên) trong 290 nến gần nhất. Với mỗi pivot, gom các pivot khác nằm trong dải rộng tối đa 5% của (đỉnh − đáy 300 nến) thành một "kênh"; điểm mạnh = 20 điểm cho mỗi pivot + số nến trong 290 nến gần nhất mà high hoặc low chạm kênh. Chọn tối đa 6 kênh mạnh nhất, loại kênh trùng nhau, sắp theo sức mạnh. Phá kháng cự = close trước ≤ cận trên kênh và close nay > cận trên, khi giá không nằm trong kênh nào; phá hỗ trợ đối xứng.

**KIỂM LOGIC**
- Công thức: như trên; toàn bộ tính lại mỗi khi có pivot mới.
- Nến đóng hay đang hình thành: tín hiệu phá dùng close và close[1], không chặn `barstate.isconfirmed` ⇒ trên nến realtime có thể bật rồi mất. Lịch sử là bản đóng.
- Repaint/look-ahead: pivot xác nhận trễ 10 nến (`pivothigh(prd, prd)`); danh sách kênh đổi mỗi khi có pivot mới nên vùng hiển thị lúc đó khác vùng đã thấy trước đó; kênh vẽ bằng box chỉ phản ánh trạng thái hiện tại, không lưu lịch sử kênh theo thời gian ⇒ nhìn lại đồ thị dễ tưởng kênh luôn có sẵn. Không dùng `security`. Mức tính điểm quét lùi 290 nến mỗi lần ⇒ nặng.
- Tham số mặc định: pivot 10, nguồn High/Low, rộng tối đa 5%, mạnh tối thiểu 1 (2 pivot), 6 kênh, lookback 290.
- Điểm yếu: độ rộng 5% của khoảng 300 nến quá lớn với vàng khung nhỏ (vùng rất dày); điểm "số nến chạm" thiên về vùng cũ đã bị phá; điều kiện phá bỏ qua trường hợp mở trong kênh rồi vượt; không có xác nhận retest, SL/TP.
- Chuyển EA MT5 vàng: CÓ, trung bình — có thể viết lại khối pivot → kênh → sức mạnh với dữ liệu nến đóng (tất định). Phải đặt độ rộng theo ATR thay vì % của biên 300 nến, và cố định thời điểm "kênh có hiệu lực" là sau khi pivot được xác nhận. Tốn CPU nhưng chỉ chạy trên nến mới.
- Giấy phép: MPL 2.0 ⇒ viết lại, không chép tệp.
**Vì sao đáng/không đáng thử:** đáng thử như bộ lọc vùng cho thiết lập khác (vào lệnh ở vùng mạnh, không đuổi phá); dùng riêng làm hệ thống phá vùng thì trùng tv-sr-breaks-luxalgo và chưa có bằng chứng.
