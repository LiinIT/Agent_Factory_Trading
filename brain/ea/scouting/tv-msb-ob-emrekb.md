---
name: tv-msb-ob-emrekb
kind: scouting
source_url: https://www.tradingview.com/script/DkE7UniD/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong đầu mã; copyleft theo từng file — chỉ lấy ý tưởng, không dùng lại mã)
claim_by_source: đánh dấu Market Structure Break và Order/Breaker/Mitigation Block; không nêu số liệu hiệu quả; tác giả đang phát triển hệ thống cảnh báo chính xác hơn (thừa nhận cảnh báo hiện tại chưa tốt)
red_flags: [không có backtest, khái niệm OB/BB chưa kiểm chứng, tác giả ghi nhận bug cảnh báo lặp, vẽ lại nhãn MSB lùi về quá khứ, nhiều lần sửa lỗi]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 7, 64K boost, Editors' pick, Pine v5, 204 dòng, overlay.
ZigZag đơn giản: xu hướng zigzag lật xuống khi low chạm mức thấp nhất của 9 nến, lật lên khi high chạm mức cao nhất của 9 nến; mỗi lần lật ghi đỉnh/đáy của đoạn vừa kết thúc. MSB (đảo cấu trúc): thị trường tăng bị đảo thành giảm khi đáy mới thấp hơn đáy trước và phá thêm một tỷ lệ 0.33 của biên độ; ngược lại cho chiều giảm. Order Block = nến ngược chiều cuối cùng trước đoạn phá; Breaker/Mitigation Block = nến cùng loại nằm ở vùng trước đó. Hộp bị xoá khi close vượt qua đầu bên kia; có alert khi giá vào hộp.

**KIỂM LOGIC**
- Công thức: như trên; không có lệnh vào/ra.
- Nến đóng hay đang hình thành: `to_up/to_down` dùng high/low hiện tại ⇒ trên nến realtime zigzag và MSB có thể đổi trong nến; alert vào hộp tính theo close hiện tại, tác giả nói "bắn mỗi nến".
- Repaint/look-ahead: zigzag chỉ biết đỉnh/đáy sau khi giá phá mức cực trị 9 nến ngược lại (xác nhận trễ, độ trễ không cố định); các đường, nhãn MSB và hộp OB vẽ lùi về nến trong quá khứ (`h1i`, `l0i`, `bu_ob_index`) ⇒ nhìn lịch sử như thấy trước. Không dùng `security` ở bản hiển thị (ghi chú phát hành nói từng có tuỳ chọn khung cao nhưng mã hiện tại không có). Vòng lặp tìm OB quét ngược theo chỉ số ⇒ chạy nặng.
- Tham số mặc định: ZigZag 9, fib 0.33, xoá hộp cũ bật, hiện zigzag bật.
- Điểm yếu: zigzag 9 nến rất nhạy ⇒ nhiều MSB trên M1–M15; cách xác định OB chỉ dựa màu nến; hộp không có điều kiện "chạm lần đầu"; mã nhiều chỗ khó kiểm (vòng lặp chỉ số có thể lệch); khái niệm chưa có bằng chứng thống kê.
- Chuyển EA MT5 vàng: CÓ MỘT PHẦN — zigzag N nến và phá cấu trúc làm được trên nến đóng không repaint (dùng đỉnh/đáy đã xác nhận). OB làm lại bằng định nghĩa rõ (nến ngược chiều trước đoạn phá), phải tự viết, không bắt chước vòng lặp. Độ ưu tiên thấp hơn các mục thuần tính toán.
- Giấy phép: MPL 2.0 ⇒ viết lại độc lập.
**Vì sao đáng/không đáng thử:** ý tưởng MSB + vào lại vùng OB là giả thuyết SMC; chỉ thử nếu có định nghĩa không repaint và kiểm out-of-sample; trùng ý với thẻ tv-smc-luxalgo.
