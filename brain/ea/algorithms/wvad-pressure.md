---
name: wvad-pressure
kind: algorithm
summary: Áp lực mua-bán theo Williams Variable A/D (thân nến × volume, làm mượt); cắt đường tín hiệu để vào
license: CC BY-NC-SA 4.0 (chỉ báo gốc "Williams Variable A/D Pressure" của MarkitTick)
source_url: chỉ báo Pine "Williams Variable A/D Pressure" (MarkitTick)
used_by: [ea03, ea09, ea10]
confidence: chua-kiem-chung
condition: chưa có backtest trong sổ
evidence: không có
updated: 2026-10-24
---
**Ý tưởng:** EA03 vào khi đường áp lực cắt đường tín hiệu, SL 1.5×ATR, lot 2% rủi ro, chốt 1R/2R/3R (33%/33%/hết). EA09 cải tiến: nến đóng, lọc ADX + xu hướng khung lớn. EA10: breakout vùng đi ngang phiên A lọc bằng WVAD.
**Lưu ý:** volume ở đây là tick volume của broker, không phải volume thị trường.
**Điểm mạnh/yếu:** chưa có số liệu.
