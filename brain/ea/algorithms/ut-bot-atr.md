---
name: ut-bot-atr
kind: algorithm
summary: Đường UT Bot bám giá theo ATR; giá đóng cửa vượt đường → Buy, rơi dưới → Sell, đảo chiều
license: chưa xác định (indicator cộng đồng)
source_url: UT Bot (cần xác minh nguồn)
used_by: [ea02, ea04]
confidence: chua-kiem-chung
condition: chưa có backtest trong sổ
evidence: không có
updated: 2026-10-24
---
**Ý tưởng:** trailing stop dạng ATR làm tín hiệu; EA02 đặt SL ở đáy/đỉnh gần nhất, dời SL bậc thang (50 giá → +10, mỗi 50 giá thêm +40).
**Điểm mạnh/yếu:** chưa có số liệu.
