---
name: ea13
kind: bot-profile
file: 13_SuperScalping_DCA.mq5
version: "6.17"
algorithms: []
patterns: []
hypothesis: grid-dca-hedge-vang
verdict: KHONG-DAT
confidence: da-backtest
updated: 2026-10-24
---
## Lý lịch
Gold_GridStop_DCA, dựa trên EA07 v5.93. Lệnh chờ Stop, DCA theo khoảng cách liên tiếp (InpDCAGaps 4,8; lot 0.03/0.05), hedge, trailing rổ, dừng bot trong ngày khi lỗ ≥ InpMaxDailyLossUSD.
## Điều kiện thử
XAUUSDm, 07–10/2026, real ticks, phiên cũ trước DV2 (chưa theo chuẩn vốn 1000).
## Điểm mạnh (số liệu + nguồn)
- Cửa sổ 5 ngày có thể +$160 (gold-ea-backtest-findings). Không đại diện, xem pitfall `backtest-ngan-khong-dai-dien`.
- Preset runner không DCA (SL 5, trailing $8/30%) thua ít nhất.
## Điểm yếu (số liệu + nguồn)
- 3 tháng −$700 đến −$2,245, PF 0.90–0.93; kỳ vọng/lệnh ≈ −spread.
- Rổ đầy (5 lệnh) thua gấp 3–5 lần lãi trung bình.
- Cắt khi MA đảo chiều làm xấu thêm.
## Lịch sử đổi và tác động
Chuỗi thay đổi v6.12–v6.17 (lọc khoảng cách MA, lot DCA theo danh sách, dừng theo lỗ ngày) không cứu được kỳ vọng.
## Kết luận
KHÔNG ĐẠT; user kết luận không khả thi. Xem `grid-dca-hedge-vang`.
