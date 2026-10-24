---
name: tre-lenh-ngau-nhien-lech-scalper
kind: pitfall
area: kiem-thu
severity: cao
found_in: EA13 (SuperScalping)
updated: 2026-10-24
---
**Triệu chứng:** cùng cấu hình, ExecutionMode khác nhau cho kết quả khác hẳn (+$160 so với +$42).
**Nguyên nhân:** scalper nhạy với độ trễ khớp lệnh; `ExecutionMode=0` (không trễ) quá lạc quan.
**Cách tránh/kiểm tra:** mọi bot phải có ít nhất một lần chạy CÓ trễ (`ExecutionMode=-1`) trước khi kết luận; ghi rõ mô hình trễ trong hồ sơ.
