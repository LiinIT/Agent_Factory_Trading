---
name: nadaraya-watson-envelope
kind: algorithm
summary: Đường bao hồi quy kernel (Nadaraya-Watson) làm biên trên/dưới; tín hiệu khi giá cắt biên, dùng điểm cuối không repaint trên nến đóng
license: CC BY-NC-SA 4.0 (gốc LuxAlgo; bản port giữ cùng giấy phép, phi thương mại)
source_url: indicator "Nadaraya-Watson Envelope" của LuxAlgo
used_by: [ea21]
confidence: chua-kiem-chung
condition: chưa có backtest nào
evidence: không có (README EA21 ghi rõ chưa xác nhận bằng backtest)
updated: 2026-10-24
---
**Ý tưởng:** làm mượt giá bằng kernel Gauss, biên = đường mượt ± mult × MAE. Buy khi giá cắt xuống dưới biên dưới, Sell khi cắt lên trên biên trên (hồi quy về trung bình).
**Tham số EA21:** bandwidth 8.0, multiplier 3.0, nguồn Close, chỉ nến đóng.
**Điểm mạnh:** chưa có số liệu.
**Điểm yếu:** chưa có số liệu. Rủi ro lý thuyết: ngược xu hướng mạnh thì biên bị phá liên tục; EA21 bù bằng SMA34/89 và nhồi lot nên thành rủi ro khác (xem pitfall `co-nhieu-lenh-tang-lot-khi-dao-chieu`).
