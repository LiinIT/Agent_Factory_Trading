---
name: tv-adx-di-beikabuoyaji
kind: scouting
source_url: https://www.tradingview.com/script/VTPMMOrx-ADX-and-DI/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong mã) — công thức ADX là kiến thức chung; chỉ lấy ý tưởng
claim_by_source: cài đặt ADX/DI theo tài liệu StockCharts; không nêu tín hiệu hay số liệu
red_flags: [không có chiến lược kèm theo, không backtest, làm mượt ADX bằng SMA lệch chuẩn Wilder]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 14, 45.4K boost, Pine v4, 32 dòng, không overlay. DM+ = mức tăng high nếu lớn hơn mức giảm low, ngược lại 0; DM− đối xứng; TR chuẩn. Ba chuỗi (TR, DM+, DM−) làm mượt kiểu Wilder: giá trị mới = giá trị cũ − giá trị cũ/len + giá trị hiện tại (len 14). DI+ = DM+ mượt / TR mượt × 100, DI− tương tự; DX = |DI+ − DI−| / (DI+ + DI−) × 100; ADX = SMA(DX, len). Vẽ đường mức 20.

**KIỂM LOGIC**
- Công thức: như trên. Điểm lệch: ADX dùng SMA của DX thay vì làm mượt Wilder, nên giá trị hơi khác ADX chuẩn của MT5 (iADX) và Wilder gốc. Chuỗi mượt không chia len ở bước khởi tạo ⇒ DI+/DI− ở nhịp đầu bị thang đo sai nhưng tỷ lệ vẫn đúng.
- Nến đóng hay đang hình thành: tính trên nến hiện tại; trên nến đóng là cố định, nến đang chạy đổi liên tục (không có tín hiệu nên không quan trọng).
- Repaint/look-ahead: không có `security`, không có pivot, không vẽ lại lịch sử ngoài nến hiện tại.
- Tham số mặc định: len 14, ngưỡng 20.
- Điểm yếu: ADX trễ nhiều (làm mượt hai lần); chỉ đo độ mạnh xu hướng, không cho hướng vào lệnh; giao cắt DI cho nhiều tín hiệu giả khi đi ngang; ngưỡng 20 chưa tối ưu cho vàng.
- Chuyển EA MT5 vàng: CÓ, đơn giản — MT5 có sẵn iADX (Wilder). Dùng làm bộ lọc chế độ (ADX > ngưỡng = cho phép theo xu hướng, ngược lại = đi ngang), đọc trên nến đóng (shift 1). Không phải nguồn lợi thế riêng.
- Giấy phép: MPL 2.0; ADX là công thức công khai nên không vướng.
**Vì sao đáng/không đáng thử:** đáng như bộ lọc chế độ thị trường kết hợp với họ trailing/breakout (ví dụ tv-ut-bot-alerts-quantnomad, tv-supertrend-kivancozbilgic) để giảm whipsaw; không đáng thử như chiến lược độc lập.
