---
name: tv-squeeze-momentum-lazybear
kind: scouting
source_url: https://www.tradingview.com/script/nqQ1DT5a-Squeeze-Momentum-Indicator-LazyBear/
fetched_at: 2026-10-24
license: mã mở trên TradingView, không ghi giấy phép riêng (áp dụng House Rules của TradingView: đọc để học, không đăng lại) — chỉ lấy ý tưởng
claim_by_source: biến thể của "TTM Squeeze" (John Carter): BB nằm trong KC là nén biến động, hết nén thì vào lệnh theo chiều động lượng; tác giả tự nói cần thêm ADX/WaveTrend để khỏi bỏ lỡ điểm vào
red_flags: [không có backtest, mã hiển thị có lỗi hệ số BB (tác giả đã thừa nhận, bản sửa nằm ở pastebin), phụ thuộc bản sửa ngoài TradingView]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 2, 117.5K boost, Pine v1 (2014), 40 dòng, tắt overlay (dao động).
Nén (squeeze ON): dải Bollinger (SMA20 ± hệ số×độ lệch chuẩn của close) nằm gọn trong kênh Keltner (SMA20 ± 1.5×SMA(True Range,20)). Hết nén khi BB vượt ra khỏi KC. Động lượng = hồi quy tuyến tính (20 bar, điểm cuối) của [close − trung bình của (trung điểm highest-high/lowest-low 20 bar) và SMA close 20]. Histogram 4 màu theo dấu và hướng tăng/giảm của động lượng.

**KIỂM LOGIC**
- Công thức: như trên; không có lệnh vào/ra trong mã, quy tắc vào/ra chỉ nằm ở lời mô tả (vào khi hết nén đầu tiên, theo dấu động lượng; thoát khi đổi màu).
- Nến đóng hay đang hình thành: tính trên close hiện tại; trên nến đang chạy giá trị đổi theo từng tick; trên nến đóng thì cố định.
- Repaint/look-ahead: KHÔNG dùng `request.security`, KHÔNG có pivot trễ ⇒ không nhìn trước; chỉ nhấp nháy nội nến. Hồi quy tuyến tính chỉ dùng dữ liệu quá khứ.
- Lỗi mã: dòng `dev` dùng hệ số KC (1.5) thay vì hệ số BB (2.0) trong mã đang hiển thị ⇒ BB hẹp hơn chuẩn, nén bật nhiều hơn. Tác giả thừa nhận, bản sửa ngoài TradingView (không mở được ở đây). Khi viết EA phải dùng hệ số BB 2.0 theo thiết kế gốc và ghi rõ.
- Tham số mặc định: BB 20 và hệ số 2.0 (nhưng mã dùng 1.5), KC 20, hệ số KC 1.5, dùng True Range.
- Điểm yếu: không hướng ban đầu (chỉ nén ⇒ chuyển động mạnh, không biết lên hay xuống); nhiều tín hiệu giả khi nén kéo dài; chưa có quản lý rủi ro; chỉ báo dao động trễ.
- Chuyển EA MT5 vàng: CÓ — dễ nhất trong nhóm; BB, KC (SMA + ATR/TR), hồi quy tuyến tính đều tính trên nến đã đóng. Vàng có chu kỳ nén/bung rõ theo phiên nên đáng thử trên M15–H1, cần kiểm bằng backtest.
- Giấy phép: mã mở theo luật TradingView, không có điều khoản tái sử dụng rõ ⇒ viết lại từ công thức đã diễn đạt (BB/KC/hồi quy là công thức công khai).
**Vì sao đáng thử:** logic đơn giản, không repaint, công thức công khai; ứng viên sạch nhất của nhóm top 1–10 để thành EA. Cần kiểm chứng out-of-sample, chưa có bằng chứng lợi nhuận.
