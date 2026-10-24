---
name: build-string-non-string-passed
kind: pitfall
area: ky-thuat
severity: thap
found_in: EA14 v1.21, EA15 v1.61, EA16 v1.11
updated: 2026-10-24
---
**Triệu chứng:** dòng BUILD in lỗi "non-string passed".
**Nguyên nhân:** truyền kiểu không phải string vào hàm in/ghép chuỗi.
**Cách tránh/kiểm tra:** ép kiểu rõ ràng (`(string)` / `TimeToString`) khi ghép dòng BUILD; ban `soat-ma` kiểm.
