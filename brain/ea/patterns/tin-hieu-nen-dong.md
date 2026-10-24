---
name: tin-hieu-nen-dong
kind: pattern
summary: Tính tín hiệu chỉ trên nến đã đóng, mỗi nến tối đa một lần thử, cache cùng nến
source: 21_Nadaraya_Watson_Envelope.mq5:GetSignal
compiled_clean: true
used_by: [ea21]
risk: dữ liệu < 1000 nến thì tín hiệu sai; không bảo đảm có lợi thế
updated: 2026-10-24
---
**Khi dùng:** mọi EA cần tránh repaint. EA21 yêu cầu >= 1000 nến lịch sử.
