---
name: trailing-hon-tp-co-dinh
kind: hypothesis
claim: Gồng lãi bằng trailing ATR cho kỳ vọng cao hơn TP cố định
reject_if: chênh lệch < 0 hoặc không lặp lại giữa các giai đoạn
result: DAT
condition: EA14, XAUUSDm, 07–10/2026, real ticks, ~600 lệnh (phiên cũ trước DV2)
evidence: gold-ea-backtest-findings
tested_by: [ea14]
updated: 2026-10-24
---
**Kết quả:** trailing hơn TP cố định khoảng $82 trên ~600 lệnh. Thứ duy nhất từng đo được là có ích.
**Hạn chế:** chỉ một EA, một giai đoạn; tín hiệu vào vẫn không có lợi thế. Cần tái lập trên EA khác và out-of-sample.
