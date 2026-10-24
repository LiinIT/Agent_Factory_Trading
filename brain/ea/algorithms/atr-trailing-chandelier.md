---
name: atr-trailing-chandelier
kind: algorithm
summary: Dời SL theo ATR (chandelier) để gồng lãi thay cho TP cố định
license: tự viết (kỹ thuật phổ biến)
source_url: tự nghĩ
used_by: [ea14, ea17, ea20, ea21]
confidence: da-backtest
condition: ghi nhận từ phiên cũ trước DV2 (XAUUSDm, 2026, real ticks); chưa tái lập theo chuẩn DV2
evidence: gold-ea-backtest-findings (EA14: trailing hơn TP cố định ~$82 trên ~600 lệnh)
updated: 2026-10-24
---
**Ý tưởng:** SL bám đỉnh/đáy ± k × ATR; lệnh thắng chạy xa, lệnh thua cắt sớm. EA21 dùng 1 ATR(14), chỉ siết SL khi khóa được lãi sau phí.
**Điểm mạnh (có số liệu):** thứ DUY NHẤT từng đo được là có ích: gồng lãi hơn TP cố định khoảng $82 trên 600 lệnh (EA14).
**Điểm yếu:** không cứu được tín hiệu vào không có lợi thế; EA13/14 vẫn âm. Cần tái lập theo điều kiện chuẩn trước khi dựa vào.
