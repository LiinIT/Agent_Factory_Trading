---
name: tv-order-block-detector-luxalgo
kind: scouting
source_url: https://www.tradingview.com/script/KvGhxGxY-Order-Block-Detector-LuxAlgo/
fetched_at: 2026-10-24
license: CC BY-NC-SA 4.0 (ghi trong mã) — phi thương mại; chỉ lấy ý tưởng, không chép mã
claim_by_source: đỉnh khối lượng (volume peak) cho thấy người tham gia lớn tích luỹ lệnh, tạo order block; khối bị "giảm nhẹ/lấp" (mitigated) tự ẩn; tác giả nói khối hiển thị hồi tố; không số liệu
red_flags: [giả thuyết "volume peak = tổ chức tích luỹ" không chứng minh, trễ length nến, dùng tick volume, mô tả có lỗi chép (bearish ghi thành bullish), không backtest]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 20, 40.6K boost, Pine v5, 233 dòng, overlay. Pivot đỉnh của volume (5 nến mỗi bên). Trạng thái xu hướng `os` = 0 nếu high của nến cách đây 5 nến cao hơn highest 5 nến gần nhất (nghĩa là nến đó là đỉnh), = 1 nếu low của nến đó thấp hơn lowest 5 nến gần nhất (đáy), ngược lại giữ trạng thái cũ. Khi có volume pivot và os = 1 (vừa có đáy giá) ⇒ bullish OB từ low đến hl2 của nến pivot; khi os = 0 ⇒ bearish OB từ hl2 đến high. Đường trung bình = trung điểm vùng. Khối bị lấp khi giá phá cận (bullish: giá thấp hơn đáy khối, tính theo wick hoặc close của 5 nến gần nhất; bearish đối xứng) ⇒ xoá. Hiển thị 3 khối chưa lấp gần nhất mỗi phía.

**KIỂM LOGIC**
- Công thức: như trên; khối nằm ở nến cách hiện tại length nến, thời điểm ở nến đó.
- Nến đóng hay đang hình thành: các điều kiện dùng high/low/volume của nến [0] (trong `ta.highest/lowest(length)` gồm nến hiện tại) và không chặn `barstate.isconfirmed` ⇒ trên nến realtime việc lấp khối và `os` có thể đổi; nhãn khối chỉ vẽ ở `barstate.islast`.
- Repaint/look-ahead: pivot volume trễ 5 nến, khối gắn vào nến lùi 5 nến (tác giả: "hiển thị hồi tố"). `os` cũng xác định lùi 5 nến. Không dùng `security`. Khối bị xoá khỏi mảng sau khi lấp nên lịch sử khối đã lấp biến mất khỏi đồ thị ⇒ không xem lại được hiệu quả quá khứ từ hình vẽ (chỉ thấy khối còn sống).
- Tham số mặc định: length 5, hiện 3 khối mỗi phía, lấp bằng wick.
- Điểm yếu: trên vàng CFD volume là tick volume; length 5 rất nhạy, sinh nhiều khối; điều kiện `os` chỉ so với 5 nến nên "xu hướng" thực chất chỉ là đỉnh/đáy cục bộ; lấp bằng wick xoá khối rất nhanh; không có quy tắc vào lệnh/SL.
- Chuyển EA MT5 vàng: CÓ — thuật toán tất định (pivot volume, đỉnh/đáy cục bộ, lấp khối), triển khai bằng nến đóng, đặt lệnh chờ tại trung điểm hoặc cận khối. Phải bỏ phụ thuộc nến [0], thêm SL theo ATR, hạn tuổi khối; ngầm giả định volume tick có ý nghĩa — cần kiểm bằng so sánh với bản không dùng volume.
- Giấy phép: CC BY-NC-SA 4.0.
**Vì sao đáng/không đáng thử:** cùng họ "vùng quay lại" với tv-order-block-finder-wugamlo nhưng có cơ chế lấp khối rõ ràng — đáng thử mức thấp-trung bình như bản có quản lý vòng đời khối; ưu tiên A/B giữa hai định nghĩa OB (chuỗi nến vs. đỉnh volume) thay vì thử riêng lẻ.
