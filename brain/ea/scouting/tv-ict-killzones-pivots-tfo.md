---
name: tv-ict-killzones-pivots-tfo
kind: scouting
source_url: https://www.tradingview.com/script/nW5oGfdO-ICT-Killzones-Pivots-TFO/
fetched_at: 2026-10-24
license: Mozilla Public License 2.0 (ghi trong đầu mã; copyleft theo từng file — chỉ lấy ý tưởng, không dùng lại mã)
claim_by_source: vẽ các phiên "killzone", đỉnh/đáy từng phiên, giá mở cửa, mức D/W/M, bảng thống kê tỷ lệ chạm; không tuyên bố lợi nhuận. Chỉ đọc được 50.000/70.631 ký tự đầu của mã (phần mức theo biên độ và bảng ở cuối không đọc)
red_flags: [không có backtest, khái niệm killzone ICT chưa kiểm chứng, thống kê "tỷ lệ chạm" tự tính không phải lợi nhuận, múi giờ New York phụ thuộc DST, chỉ đọc một phần mã]
confidence: chua-kiem-chung
---
**Ý tưởng cốt lõi (diễn đạt lại):** hạng 10, 59K boost, Editors' pick, Pine v6, 1074 dòng, overlay.
Theo giờ New York, vẽ hộp từng phiên: ASIA 20:00–00:00, LNDN 02:00–05:00, NYAM 09:30–11:00, NYPM 13:30–16:00 (NYL 12:00–13:00 và RTH tắt sẵn). Đỉnh/đáy mỗi phiên được kéo dài sang phải cho tới khi giá chạm (hoặc qua mức đó tuỳ chọn); mỗi lần chạm thì tăng bộ đếm thành công, tạo "tỷ lệ chạm" của đỉnh/đáy từng phiên. Thêm: giá mở cửa theo giờ tuỳ chọn (09:30, 12:00, 16:00), vạch dọc giờ, đỉnh/đáy/giữa của ngày-tuần-tháng trước, các mức theo biên độ phiên (trung bình/trung vị/độ lệch chuẩn nhân hệ số 0.25–1.0 từ giá mở phiên), bảng dữ liệu.

**KIỂM LOGIC**
- Công thức: phiên xác định bằng `time(…, session, timezone)`; đỉnh/đáy cập nhật theo high/low từng nến trong phiên; nhận biết chạm = high/low nến vượt đường; mức D/W/M lấy từ biến theo `timeframe.change`, không dùng `security`.
- Nến đóng hay đang hình thành: đỉnh/đáy phiên và hộp thay đổi liên tục khi phiên đang chạy; trạng thái "đã chạm" tính theo high/low của nến hiện hành ⇒ trên nến realtime có thể bật trước khi nến đóng. Cảnh báo dùng `once_per_bar`.
- Repaint/look-ahead: không `request.security`, không pivot trễ ⇒ không nhìn trước; đỉnh/đáy phiên chỉ cố định sau khi phiên kết thúc (nhìn trên lịch sử là kết quả cuối, đừng dùng trong phiên). Hộp chỉ vẽ ở khung ≤ 30 phút (giới hạn khung).
- Tham số mặc định: múi giờ America/New_York (theo DST), phiên giới hạn 3 ngày, giới hạn khung 30 phút, lookback dữ liệu 20 phiên, đo biên độ trung bình, mức biên độ tắt.
- Điểm yếu: giờ ICT gắn với New York + DST trong khi vàng/CFD MT5 dùng giờ máy chủ (thường GMT+2/+3) ⇒ phải quy đổi và tự xử lý DST; "killzone" chỉ là khung giờ có thanh khoản, không phải tín hiệu; thống kê tỷ lệ chạm không cho biết hướng/lợi nhuận; phần bảng thống kê dễ bị chọn mẫu.
- Chuyển EA MT5 vàng: CÓ NHƯNG LÀ BỘ LỌC/ĐẶT MỨC, không phải hệ thống. Hợp lý: phiên (London/NY) làm bộ lọc giờ giao dịch, đỉnh/đáy phiên Á làm mức breakout hoặc quét thanh khoản vào London. Phải tự tính bằng nến đóng, quy đổi giờ NY→giờ máy chủ có DST. Phù hợp vàng vì vàng phản ứng rõ theo phiên; cần kiểm bằng backtest.
- Giấy phép: MPL 2.0 ⇒ viết lại độc lập.
**Vì sao đáng thử:** ý tưởng phiên Á đặt biên, London/NY phá vỡ hoặc quét là khung giả thuyết rõ, đo được; không đáng thử phần "ICT" ngoài khung giờ (không có quy tắc giao dịch).
