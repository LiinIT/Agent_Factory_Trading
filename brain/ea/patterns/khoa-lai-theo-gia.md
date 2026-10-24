---
name: khoa-lai-theo-gia
kind: pattern
summary: Lãi ≥ trigger thì SL về entry ± offset để lãi không thành âm
source: 17_Trend_Lock.mq5 (tìm "Lock" trong file; xác nhận hàm trước khi dùng)
compiled_clean: false
used_by: [ea17, ea18, ea19]
risk: offset nhỏ dễ bị quét; đã chỉnh 20→+10 rồi +3 (có dấu hiệu tối ưu trên dữ liệu)
updated: 2026-10-24
---
**Khi dùng:** đừng tin giá trị tham số cũ; cần walk-forward.
