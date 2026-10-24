---
name: backtest-ngan-khong-dai-dien
kind: pitfall
area: kiem-thu
severity: cao
found_in: EA13, EA14
updated: 2026-10-24
---
**Triệu chứng:** 5 ngày +$160 nhưng 3 tháng (07–10/2026) −$700 đến −$2,245 (EA13); EA14 M15 dương ngắn hạn, nửa 07–10 PF 0.56.
**Nguyên nhân:** mẫu nhỏ, một chế độ thị trường.
**Cách tránh/kiểm tra:** tối thiểu nhiều tháng và chia train/test (out-of-sample); không kết luận từ cửa sổ vài ngày; nêu số lệnh để biết có ý nghĩa thống kê hay không.
