---
name: ea21
kind: bot-profile
file: 21_Nadaraya_Watson_Envelope.mq5 (repo Bot-EA21-Trading-XAUUSD-Nadaraya-watson-SMA34_89/src/EA21_NWE_SMA34_89.mq5)
version: "2.03"
algorithms: [nadaraya-watson-envelope, sma-trend-filter-34-89, atr-trailing-chandelier]
patterns: [tin-hieu-nen-dong, ro-lenh-trailing-theo-lai-rong, gioi-han-so-lenh-va-khoang-cach, khoi-phuc-ro-sau-khi-khoi-dong-lai]
hypothesis: nwe-sma-ro-nhoi-lot
verdict: CHUA-KIEM-CHUNG
confidence: chua-kiem-chung
updated: 2026-10-24
---
## Lý lịch
Nadaraya-Watson Envelope (LuxAlgo, CC BY-NC-SA 4.0) + SMA34/89. Lot 0.02, tối đa 5 lệnh, cách nhau ≥ 2 giá. Đảo chiều mở 2× tổng lot phía đối diện, giữ lệnh cũ. Mặc định không SL ban đầu, giữ TP (RR 2). Lãi ròng rổ ≥ $20 → trailing 1 ATR(14) cả hai phía. Chế độ AUTO/MANUAL/PAUSE/RISK, dashboard. Magic 210021. Biên dịch 0 lỗi 0 cảnh báo (kiểm 2026-10-24).
## Điều kiện thử
Chưa chạy backtest nào.
## Điểm mạnh (số liệu + nguồn)
Chưa có số liệu.
## Điểm yếu (số liệu + nguồn)
Chưa có số liệu. Rủi ro theo thiết kế (README): nhân đôi lot khi đảo chiều làm khối lượng và drawdown tăng nhanh; không SL ban đầu mặc định; gap/trượt giá. Cấu trúc gần EA13 (nhồi lot, rổ) nên đã bị bác bỏ trước ở một biến thể.
## Lịch sử đổi và tác động
Chưa có số liệu theo từng version; các bản v1.90–v2.03 chủ yếu thêm UI, giới hạn lệnh, USC.
## Kết luận
CHƯA KIỂM CHỨNG. Việc đầu tiên: chạy theo chuẩn DV2 (vốn 1000, real ticks, có trễ, train/test), ghi margin level thấp nhất và tổng lot lớn nhất.
