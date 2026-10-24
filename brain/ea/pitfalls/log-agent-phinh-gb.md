---
name: log-agent-phinh-gb
kind: pitfall
area: ky-thuat
severity: trung-binh
found_in: EA07 v5.96, runner mt5bt
updated: 2026-10-24
---
**Triệu chứng:** tester chậm hoặc hỏng; log agent lên hàng GB (`mt5bt/Tester/Agent-*/logs`).
**Nguyên nhân:** EA in log mỗi tick (EA07 v5.96: `[SL LOCK]` in mỗi tick), hoặc tài khoản cạn spam "not enough money".
**Cách tránh/kiểm tra:** chỉ log khi đổi trạng thái / mỗi lệnh một lần; ban `thu-nghiem` xóa log agent sau khi đọc.
