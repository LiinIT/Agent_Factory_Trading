---
name: grid-dca-hedge-vang
kind: hypothesis
claim: Rải lệnh chờ + DCA khi âm + hedge + trailing rổ cho kỳ vọng dương trên XAUUSD
reject_if: PF < 1.0 trên 3 tháng real ticks
result: KHONG-DAT
condition: XAUUSDm, 07–10/2026, real ticks, 0.01 lot (≈$1/giá), spread ~$0.26; vốn lớn để không cháy (phiên cũ trước DV2)
evidence: gold-ea-backtest-findings
tested_by: [ea13]
updated: 2026-10-24
---
**Kết quả:** 5 ngày có thể +$160, 3 tháng −$700 đến −$2,245, PF 0.90–0.93; kỳ vọng/lệnh ≈ −spread. Rổ đầy (5 lệnh) thua gấp 3–5 lần lãi trung bình. Cắt khi MA đảo chiều làm xấu thêm. Preset runner không DCA (SL 5, trailing $8/30%) thua ít nhất nhưng vẫn âm.
**Vì sao:** không có lợi thế vào lệnh; DCA chỉ phóng đại thua lỗ khi chạy ngược.
**Đừng thử lại trừ khi:** đổi hướng hoàn toàn (khung ≥M30, theo xu hướng, walk-forward). Đừng đề xuất lại DCA/hedge/BE-rolling.
