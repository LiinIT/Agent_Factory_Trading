---
name: nwe-sma-ro-nhoi-lot
kind: hypothesis
claim: Giá cắt biên Nadaraya-Watson cùng chiều SMA34/89 cho lợi thế; rổ lệnh nhồi thêm lot kèm trailing ATR khi lãi ròng ≥ $20 cải thiện kỳ vọng
reject_if: PF < 1.2 trên out-of-sample, hoặc DD > 30% vốn 1000, hoặc cháy tài khoản
result: CHUA-KIEM-CHUNG
condition: chưa chạy
evidence: không có
tested_by: [ea21]
updated: 2026-10-24
---
**Kết quả:** chưa có. README EA21 ghi chưa xác nhận bằng backtest hay chạy thực.
**Rủi ro đã biết:** cấu trúc tương tự EA13 (nhồi lot, rổ), nên kỳ vọng thận trọng; bị bác bỏ nếu rổ đầy thua gấp nhiều lần lãi như EA13. Lot đảo chiều 2× có thể cháy với vốn 1000.
**Việc cần làm:** chạy theo chuẩn DV2, có một lần chạy có trễ, cắt giai đoạn train/test.
