---
name: mql5-ea
description: Quy ước viết và soát EA MQL5 trong DV2 — cấu trúc file, version/changelog/BUILD, nến đóng không repaint, kiểm tra broker, quản lý lot, danh sách soát logic. Dùng cho ea-thiet-ke, ea-che-tao, ea-soat-ma.
---

# EA MQL5 trong DV2

## Cấu trúc file `ea/<tên>.mq5`
1. Banner: tên, tác giả, **Version**, ngày cập nhật.
2. **CHANGELOG**: mỗi lần sửa nâng version và thêm một dòng `vX.Y - mô tả`.
3. `#property version` khớp banner.
4. Inputs có `input group`, ghi đơn vị; không đặt tên input giống tên cũ khi đổi ý nghĩa (tester nạp lại giá trị cũ, xem pitfall `tester-ke-thua-input`: đổi tên input để buộc giá trị mới).
5. Dòng **BUILD time** in một lần khi `OnInit` (ép kiểu `(string)`, xem pitfall `build-string-non-string-passed`).
6. `OnInit` kiểm: hedging account, đủ nến lịch sử, symbol đúng.

## Danh sách soát logic (ea-soat-ma kiểm từng mục, kèm `file:dòng`)
- Tín hiệu chỉ trên **nến đã đóng** (shift ≥ 1); không đọc nến đang hình thành để ra quyết định vào lệnh; không look-ahead khi dùng nhiều khung.
- Chuẩn hóa lot theo `SYMBOL_VOLUME_MIN/MAX/STEP`.
- Kiểm `SYMBOL_TRADE_STOPS_LEVEL` và `FREEZE_LEVEL` trước khi đặt/sửa SL/TP.
- Magic number riêng; mọi thao tác chỉ trên lệnh của EA này và symbol này.
- Xử lý lỗi `OrderSend`: requote, off quotes, no money; không gửi lại vô hạn.
- Giới hạn số lệnh và tổng lot; có kiểm margin trước khi nhồi lệnh.
- Đơn vị khoảng cách: giá ≠ points (pitfall `gia-tri-gia-khong-phai-points`).
- Spread filter; xử lý swap/commission khi tính lãi rổ.
- Không log mỗi tick (pitfall `log-agent-phinh-gb`).
- Có SL hoặc quy tắc thoát rõ; nếu không có SL ban đầu phải ghi lý do và rủi ro trong `brain/design.md`.
- Martingale/grid/nhồi lot khi âm phải được khai báo trong giả thuyết; bot ngầm có nhồi lot mà giả thuyết không nói ⇒ KHÔNG ĐẠT.

## Mẫu dùng lại
Tra `brain-ea/patterns/` trước khi viết lại; pattern trỏ tới hàm đã compile sạch.
