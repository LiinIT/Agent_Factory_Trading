---
name: ro-lenh-trailing-theo-lai-rong
kind: pattern
summary: Tính lãi ròng cả rổ (gồm swap, commission, fee, quy đổi USD/USC); đạt mốc thì bật trailing ATR cho cả hai phía và ngừng thêm lệnh
source: 21_Nadaraya_Watson_Envelope.mq5:BasketNetProfit,TrailSurvivors,ManageBasket
compiled_clean: true
used_by: [ea21]
risk: mốc kích hoạt không phải lãi đã khóa; gap/trượt giá có thể gây lỗ; hiệu quả chưa kiểm chứng
updated: 2026-10-24
---
**Khi dùng:** EA nhiều lệnh cần quản lý theo tổng. Trailing chỉ siết SL khi khóa được lãi sau phí đã biết.
