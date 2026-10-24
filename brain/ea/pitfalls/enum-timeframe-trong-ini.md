---
name: enum-timeframe-trong-ini
kind: pitfall
area: kiem-thu
severity: trung-binh
found_in: runner mt5bt
updated: 2026-10-24
---
**Triệu chứng:** tester báo lỗi 4805 hoặc chạy sai khung.
**Nguyên nhân:** ini dùng giá trị enum số, không phải số phút tùy ý.
**Cách tránh/kiểm tra:** M5=5, M15=15, M30=30, H1=16385, H4=16388. Giá trị 60 gây lỗi 4805.
