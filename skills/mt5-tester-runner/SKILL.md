---
name: mt5-tester-runner
description: Điều kiện và cách chạy MT5 Strategy Tester trong DV2 — chuẩn vốn 1000 real ticks, ini đủ input, kiểm header, giới hạn lần chạy. Máy thực thi; ban đọc kết quả dùng skill này để hiểu số liệu.
---

# Chạy tester (máy thực thi)

**Chuẩn DV2:** `Deposit=1000`, `Leverage=2000`, `Model=4` (real ticks), `Visual=0`, `ShutdownTerminal=1`, `ReplaceReport=1`. Máy ghi ĐỦ mọi input của EA (đọc từ dòng `input` trong `.mq5`) vào `[TesterInputs]`.

- Chạy trên bản portable `mt5bt`, KHÔNG trên terminal đang mở (second instance bỏ qua `/config`). Tuần tự, mỗi lần một lượt.
- Enum timeframe trong ini: M5=5, M15=15, M30=30, H1=16385, H4=16388 (pitfall `enum-timeframe-trong-ini`).
- `ExecutionMode`: `0` = không trễ, `-1` = trễ ngẫu nhiên. Mọi bot cần ít nhất một lần chạy CÓ trễ (pitfall `tre-lenh-ngau-nhien-lech-scalper`).
- Sau mỗi lần chạy máy đọc log agent, kiểm header `started with inputs` khớp ini; lệch ⇒ loại kết quả (`valid:false`), chạy lại.
- Máy xóa log agent sau khi đọc (pitfall `log-agent-phinh-gb`).
- Kết quả ghi `results/<run>.json`: chỉ số + `valid` + điều kiện thử. Ban đọc số chỉ đọc file này, không tự chạy tester.
- Vốn 1000 có thể cháy với chiến lược nhồi lot: kết quả ghi `blown:true` và ngày cháy.

## Kế hoạch chạy `brain/test-plan.json` (Ban Thiết kế lập)
```json
{
  "expert": "gold_trend",
  "runs": [
    { "id": "train-2026h1", "symbol": "XAUUSDm", "period": "H1", "from": "2026.01.05", "to": "2026.06.30", "delay": "none" },
    { "id": "oos-2026q3", "symbol": "XAUUSDm", "period": "H1", "from": "2026.07.01", "to": "2026.10.09", "delay": "random",
      "inputs": { "InpLotSize": 0.02 } }
  ]
}
```
- `expert` = `ea/<expert>.mq5`. `id` chỉ gồm chữ, số, `-`, `_`, duy nhất, **không dùng lại** (id đã có `results/<id>.json` thì máy từ chối).
- `inputs` chỉ ghi các tham số khác mặc định; tên phải có thật trong EA (máy từ chối tên lạ). Input kiểu `ENUM_TIMEFRAMES` đặt bằng tên (`"M15"`); máy đổi sang mã số.
- Vốn, leverage, model tick, `Visual` do máy cố định theo chuẩn; kế hoạch không ghi đè được.
- Máy giải mã mặc định các input kiểu số, bool, chuỗi và enum biết được; enum/biểu thức lạ phải được đặt tường minh trong `inputs`, nếu không máy báo lỗi.
- Ngân sách: số lần chạy của kế hoạch ≤ `ea.maxTesterRunsPerRound` (mặc định 12).
