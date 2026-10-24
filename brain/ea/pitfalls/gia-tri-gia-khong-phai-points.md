---
name: gia-tri-gia-khong-phai-points
kind: pitfall
area: ky-thuat
severity: trung-binh
found_in: EA21 v2.03
updated: 2026-10-24
---
**Triệu chứng:** đệm SL/khoảng cách đặt "2" nhưng ra khoảng cách sai trên vàng.
**Nguyên nhân:** nhầm đơn vị GIÁ với POINTS (XAUUSD 3300→3302 = 2 đơn vị giá, không phải 2 points).
**Cách tránh/kiểm tra:** tên input ghi rõ đơn vị (`...Price` / `...Points`), chú thích trong Inputs; `soat-ma` kiểm mọi input khoảng cách.
