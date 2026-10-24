---
name: tester-ke-thua-input
kind: pitfall
area: kiem-thu
severity: cao
found_in: EA13-EA19 (nhiều phiên tối ưu)
updated: 2026-10-24
---
**Triệu chứng:** kết quả backtest lệch so với cấu hình định test; lần chạy "không đổi gì" lại ra số khác.
**Nguyên nhân:** tester KẾ THỪA giá trị input đã lưu cho mọi tham số không ghi trong ini/preset. Đổi tên input thì giá trị cũ không bị nạp lại (changelog EA17 v1.31, EA18 v1.01 phải đổi tên `InpMaxHoldBars`→`InpHoldBarsLimit`, `InpLockProfitPrice`→`InpLockOffsetPrice` vì tester nạp lại 196 và 10).
**Cách tránh/kiểm tra:** ini ghi ĐỦ mọi input; sau mỗi lần chạy đọc header `started with inputs` trong log agent và so khớp ini; lệch thì loại kết quả và chạy lại.
