# Danh mục 21 bot

Nguồn: header các file `.mq5` trong `MQL5/Experts` (cập nhật 2026-10-24). Chỉ EA13, EA14 có số liệu; còn lại CHƯA KIỂM CHỨNG và chưa có hồ sơ riêng.

| # | Tên | Ý tưởng chính | Verdict |
|---|---|---|---|
| 01 | ForcePeak_EMA v3.00 | Lực mua/bán đạt đỉnh rồi yếu + EMA 9/30 đồng ý; đảo chiều | CHƯA |
| 02 | UT_Bot_EA2 v2.33 | UT Bot (ATR) vượt đường; SL đáy/đỉnh, dời SL bậc thang | CHƯA |
| 03 | WVADP_EA v1.00 | Áp lực WVAD cắt tín hiệu; SL 1.5 ATR, lot 2% rủi ro, chốt 1R/2R/3R | CHƯA |
| 04 | ForcePeak_UT_Hybrid v1.06 | Ghép 01 + 02, lọc H1/ADX, chốt nửa lệnh | CHƯA |
| 05 | News Scalper v1.54 | Rải lệnh chờ quanh Bid/Ask, tự hủy sau 15 giây | CHƯA |
| 06 | MA9/MA30 cross v1.15 | MA cắt, luôn đảo chiều | CHƯA |
| 07 | Gold_GridStop_DynamicSL_FVG v5.98 | Grid Stop + SL động + FVG (gốc của 13) | CHƯA |
| 08 | Scaping_v2 v2.00 | Biến thể grid 5.93 | CHƯA |
| 09 | WVADP cải tiến v1.00 | Từ 03: nến đóng, lọc ADX + xu hướng khung lớn | CHƯA |
| 10 | Breakout phiên WVAD v1.00 | Breakout vùng đi ngang phiên A lọc WVAD | CHƯA |
| 11 | Trident Swing ABC v1.00 | Pivot A-B-C → 3 lệnh chờ Stop TP1/2/3 (MarkitTick, CC BY-NC-SA) | CHƯA |
| 12 | SMC TickVolume v3.00 | Máy trạng thái SMC, không grid/martingale | CHƯA |
| 13 | Gold_GridStop_DCA v6.17 | Grid + DCA + hedge + trailing rổ | KHÔNG ĐẠT |
| 14 | Gold_DojiReversal v1.21 | Doji đảo chiều + trailing ATR | KHÔNG ĐẠT |
| 15 | Gold_LiquidityDelta v1.61 | Port Liquidity Delta Profiler (LuxAlgo), EMA 34/89 M30, structure trail | CHƯA |
| 16 | Gold_TrendConfirm v1.11 | Theo xu hướng sau nhịp hồi + nến xác nhận | CHƯA |
| 17 | Gold_TrendConfirmLock v1.41 | 16 + khóa lãi theo giá | CHƯA |
| 18 | Gold_TrendCross v1.10 | 17 + vào khi MA cắt; SL theo thanh khoản cũ | CHƯA |
| 19 | Gold_MACross v1.55 | MA cắt, DCA, SL chung khóa 5 USD khi lãi rổ > 20 | CHƯA |
| 20 | Gold_TrendBreakoutATR v1.00 | H4 Donchian/EMA pullback, risk % vốn, chandelier | CHƯA |
| 21 | EA21 NWE + SMA34/89 v2.03 | NWE + SMA, rổ nhồi lot, trailing ATR | CHƯA |

Ghi chú: 13/14 đúng với kết luận trong memory; mọi ô CHƯA là "chưa có số liệu lưu lại", không phải "tốt" hay "xấu".
