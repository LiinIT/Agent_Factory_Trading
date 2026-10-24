---
name: ea14
kind: bot-profile
file: 14_Doji_Reversal.mq5
version: "1.21"
algorithms: [atr-trailing-chandelier]
patterns: []
hypothesis: doji-dao-chieu-vang
verdict: KHONG-DAT
confidence: da-backtest
updated: 2026-10-24
---
## Lý lịch
Gold_DojiReversal: doji tại đỉnh/đáy sau xu hướng, vào sau nến xác nhận (v1.20: vào ngay khi gặp doji, đảo chiều khi doji ngược, gồng bằng trailing ATR), SL ngoài doji, TP theo R.
## Điều kiện thử
XAUUSDm, 07–10/2026, real ticks, phiên cũ trước DV2.
## Điểm mạnh (số liệu + nguồn)
- M15 có xác nhận +$61 (49 lệnh, PF 1.15); không xác nhận +$121 (PF 1.14).
- Trailing hơn TP cố định ~$82 trên ~600 lệnh (xem `trailing-hon-tp-co-dinh`).
## Điểm yếu (số liệu + nguồn)
- "Gặp doji đảo ngay + trailing": −$130 trên 606 lệnh; nửa 07–10 PF 0.56.
- M5 luôn âm; M30 chỉ +$54, PF 1.03. Không có ý nghĩa thống kê.
## Lịch sử đổi và tác động
v1.20 bỏ bắt buộc xác nhận, nhiều lệnh hơn nhưng kết quả xấu đi so với bản có xác nhận.
## Kết luận
KHÔNG ĐẠT. Xem `doji-dao-chieu-vang`.
