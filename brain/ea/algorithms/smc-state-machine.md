---
name: smc-state-machine
kind: algorithm
summary: Máy trạng thái SMC: H1 bias → sweep → displacement → MSS → FVG sau sweep → retest đầu → xác nhận M5 → vào lệnh
license: tự viết (khái niệm SMC)
source_url: tự nghĩ
used_by: [ea12]
confidence: chua-kiem-chung
condition: chưa có backtest trong sổ
evidence: không có
updated: 2026-10-24
---
**Ý tưởng:** chuỗi điều kiện cứng, không grid/martingale/ép đảo chiều; sau vào lệnh có BE, khóa lãi và trail theo cấu trúc.
**Lưu ý:** tick volume không phải volume thị trường. Chuỗi điều kiện dài nên ít lệnh, khó đủ mẫu thống kê ở tháng ngắn.
