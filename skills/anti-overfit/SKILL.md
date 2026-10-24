---
name: anti-overfit
description: Luật chống overfit cho ea-phan-bien — out-of-sample, walk-forward, nhạy tham số, có/không trễ, số lệnh tối thiểu, kịch bản căng. Dùng khi phán ĐẠT/KHÔNG ĐẠT một bot.
---

# Chống overfit

Mục tiêu: loại sớm bot không có lợi thế, không phải chứng minh bot tốt.

## Điều kiện cần để phán ĐẠT (thiếu một mục ⇒ không ĐẠT, ghi CHƯA ĐỦ BẰNG CHỨNG)
1. **Tiêu chí bác bỏ** lấy từ `brain/hypothesis.md` (đặt trước test). Không dùng tiêu chí mới đặt sau.
2. **Out-of-sample**: ít nhất một giai đoạn chưa dùng để chọn tham số; tiêu chí phải đạt ở đó.
3. **Walk-forward** hoặc nhiều giai đoạn liên tiếp: lợi thế không chỉ ở một tháng.
4. **Số lệnh tối thiểu** ghi trong hypothesis (mặc định ≥ 100 lệnh); dưới mức đó ⇒ không có ý nghĩa thống kê.
5. **Có trễ**: ít nhất một lần chạy `ExecutionMode=-1`; kết quả không được sụp so với không trễ.
6. **Nhạy tham số**: lệch ±20% các tham số chính, kết quả không được đổi dấu.
7. **Kịch bản căng**: spread tăng, giai đoạn tin tức, gap; ghi DD, margin level thấp nhất, tổng lot lớn nhất.
8. **Cháy tài khoản (vốn 1000)** ⇒ KHÔNG ĐẠT dù tổng lợi nhuận trước khi cháy dương.

## Dấu hiệu overfit cần gắn cờ
- Changelog có nhiều vòng chỉnh tham số trên cùng giai đoạn.
- Kết quả đẹp ở M15 nhưng âm ở M5/M30 (không bền theo khung).
- Lợi nhuận tập trung vào vài lệnh.
- PF sát 1.0 với số lệnh nhỏ.

## Quy tắc quay về
KHÔNG ĐẠT ⇒ về `ea-nghien-cuu` (bác bỏ hoặc đổi giả thuyết), không về `ea-che-tao` chỉnh tham số.
