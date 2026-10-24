---
name: tv-williams-vix-fix-chrismoody
kind: scouting
source_url: https://www.tradingview.com/script/og7JPrRA-CM-Williams-Vix-Fix-Finds-Market-Bottoms/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (House Rules); ý tưởng gốc của Larry Williams, công thức công khai — chỉ lấy ý tưởng
claim_by_source: "tìm đáy thị trường", cho kết quả giống VIX trên mọi loại tài sản, "chạy RẤT TỐT trên khung trong ngày"; không kèm số liệu
red_flags: [lời quảng bá không số liệu, chỉ bắt đáy (một chiều), tác giả quảng bá dịch vụ riêng, tham số bách phân vị tự chế]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 6, 65.9K boost, Pine v1 (2014), 28 dòng, dao động.
Williams Vix Fix (WVF) = (đỉnh close cao nhất 22 nến − low hiện tại) / (đỉnh close cao nhất 22 nến) × 100, tức mức sụt của giá tính từ đỉnh gần đây theo phần trăm; càng cao nghĩa là hoảng loạn/đáy gần. Cột sáng (lime) khi WVF vượt dải Bollinger trên của chính nó (SMA20 + 2×độ lệch chuẩn 20) hoặc vượt 85% mức cao nhất trong 50 nến. Có dòng tuỳ chọn hiện ngưỡng thấp (1.01×thấp nhất 50 nến) nhưng không dùng để tô màu.

**KIỂM LOGIC**
- Công thức: như trên; không có tín hiệu vào/ra ngầm ngoài việc cột sáng = "có thể đáy".
- Nến đóng hay đang hình thành: dùng `low` của nến hiện tại ⇒ trên nến đang chạy, WVF tăng dần khi giá tạo đáy mới và có thể bật sáng giữa nến; sau khi đóng thì cố định.
- Repaint/look-ahead: không `security`, không pivot; chỉ nhấp nháy nội nến. Dữ liệu chỉ từ quá khứ.
- Tham số mặc định: pd 22, BB 20, hệ số 2.0, lookback 50, percentile cao 0.85, thấp 1.01; hiện dải percentile và dải độ lệch chuẩn tắt.
- Điểm yếu: chỉ bắt đáy, không có phần bắt đỉnh; trong xu hướng giảm mạnh cột sáng liên tục ("bắt dao rơi"); "tìm đáy" chỉ là mô tả, không có điều kiện xác nhận đảo chiều; ngưỡng percentile tự đặt, tối ưu theo từng tài sản.
- Chuyển EA MT5 vàng: CÓ NHƯNG PHẢI SỬA — tính tất cả trên nến đóng (dùng low nến đã đóng). Vàng thường tăng lâu dài nên bắt đáy mua có cơ sở, nhưng phải có xác nhận (vd nến xanh/đóng trên SMA ngắn) và chặn giờ tin. Là bộ lọc/điểm vào mua-the-dip, không phải hệ thống độc lập. Dễ trùng ý tưởng mean-reversion đã thử, cần kiểm hypotheses/.
- Giấy phép: không điều khoản tái sử dụng rõ; công thức công khai (Larry Williams).
**Vì sao đáng/không đáng thử:** đáng thử như bộ lọc "hoảng loạn" cho vào lệnh mua; không đáng thử nguyên trạng.
