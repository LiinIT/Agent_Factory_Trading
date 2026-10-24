---
name: sma-trend-filter-34-89
kind: algorithm
summary: Lọc xu hướng bằng SMA nhanh 34 và chậm 89 trên nến đóng
license: tự viết (công thức chuẩn)
source_url: tự nghĩ
used_by: [ea21, ea19, ea15]
confidence: chua-kiem-chung
condition: chưa có backtest riêng cho bộ lọc
evidence: không có
updated: 2026-10-24
---
**Ý tưởng:** chỉ Buy khi SMA34 > SMA89, chỉ Sell khi SMA34 < SMA89 (EA21 cho bật/tắt). EA19 dùng cặp cắt nhau làm tín hiệu vào; EA15 dùng EMA 34/89 trên M30.
**Điểm mạnh/yếu:** chưa có số liệu tách riêng; không biết bộ lọc cải thiện hay chỉ giảm số lệnh. Cần A/B (bật/tắt) trong cùng điều kiện thử.
