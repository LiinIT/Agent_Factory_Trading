---
name: doji-dao-chieu-vang
kind: hypothesis
claim: Doji tại đỉnh/đáy sau xu hướng báo đảo chiều; vào sau nến xác nhận, SL ngoài doji, TP theo R
reject_if: PF < 1.2 hoặc không đủ ý nghĩa thống kê
result: KHONG-DAT
condition: XAUUSDm, 07–10/2026, real ticks (phiên cũ trước DV2)
evidence: gold-ea-backtest-findings
tested_by: [ea14]
updated: 2026-10-24
---
**Kết quả:** M15 có xác nhận +$61 (49 lệnh, PF 1.15), không xác nhận +$121 (PF 1.14); logic "gặp doji đảo ngay + trailing" −$130 (606 lệnh); nửa 07–10 PF 0.56; M5 luôn âm; chỉ M30 nhỉnh dương (+$54, PF 1.03).
**Vì sao:** số lệnh ít, PF sát 1, không có ý nghĩa thống kê.
**Đừng thử lại trừ khi:** có tín hiệu lọc theo xu hướng/khung lớn và đủ mẫu.
