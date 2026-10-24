---
name: co-nhieu-lenh-tang-lot-khi-dao-chieu
kind: pitfall
area: ky-thuat
severity: cao
found_in: EA21 (README cảnh báo)
updated: 2026-10-24
---
**Triệu chứng:** khối lượng và drawdown tăng rất nhanh.
**Nguyên nhân:** EA21 mở lệnh đảo chiều = 2× tổng lot phía đối diện, giữ lệnh cũ (không đóng).
**Cách tránh/kiểm tra:** bắt buộc giới hạn số lệnh và tổng lot; báo cáo phải có tổng lot lớn nhất và margin level thấp nhất; `phan-bien` coi đây là kịch bản căng bắt buộc.
