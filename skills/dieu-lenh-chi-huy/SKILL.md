---
name: dieu-lenh-chi-huy
description: Điều lệnh của Chỉ huy trưởng (HoNgocKhanh) cho DV2 — cách tiếp cận, phong cách, chuẩn code MQL5, kiểm chứng, git. Bắt buộc cho mọi ban; ưu tiên trên mọi skill chung khi khác nhau.
---

# Điều lệnh Chỉ huy trưởng (DV2)

Khi skill chung nói khác, **điều lệnh này thắng**.

## 0. Mặc định cho mọi bot

- **Điều kiện thử chuẩn**: vốn 1000 USD, Model real ticks, leverage 2000, `Visual=0`. Mọi bot so sánh với nhau phải cùng điều kiện (skill `mt5-tester-runner`).
- **Nơi lưu mặc định**: `~/Documents/StudioMia_workspace/workspace_dv2/<id>` (máy tự đặt). Agent không tự đổi nơi lưu.
- **Mỗi lần sửa EA phải nâng version** + banner + changelog + dòng BUILD time (skill `mql5-ea`).
- **Không bịa số liệu.** Không có bằng chứng thì ghi `CHƯA KIỂM CHỨNG`, không báo ĐẠT.
- **Người viết không tự chấm bài của mình**: ban chế tạo không phán kết quả backtest; ban phân tích không phán ĐẠT/KHÔNG ĐẠT.
- **Bộ não** `brain/ea/` (qua đường dẫn `brain-ea/` trong project) là nguồn kiến thức chung; đọc trước khi nghĩ ý tưởng, ghi theo luật trong skill `ea-brain`.

## 1. Cách tiếp cận

1. Đọc `brain-ea/` và `brain/` của project trước; không quét lại khi đã có.
2. Việc có lựa chọn: đưa **2–3 phương án**, so trade-off, nêu phương án khuyên dùng.
3. **Phản biện thẳng** ý kém: "Cách này có vấn đề vì X. Nên Y vì Z." Không đồng ý cho có.
4. Chỉ ra overfit, edge case, rủi ro vốn mà Chỉ huy trưởng chưa nghĩ tới.
5. Chưa rõ thì hỏi (`questions`), không đoán. Mỗi câu hỏi kèm 2–4 đáp án dạng `[A | B | C]`, khuyên dùng đặt đầu.

## 2. Chuẩn code (MQL5)

- Đơn giản nhất có thể; không over-engineer; xóa code thừa thay vì comment out.
- Tên nói lên ý nghĩa; boolean `isX/hasX`; input có tiền tố `Inp` và ghi đơn vị (`...Price` ≠ `...Points`).
- Function > 50 dòng → tách; lặp ≥ 2 lần → trích dùng chung; > 4 tham số → struct.
- Không magic number/string; không nested ternary.
- Không `Print` mỗi tick; log chỉ khi đổi trạng thái hoặc mỗi lệnh một lần (xem pitfall `log-agent-phinh-gb`).
- Không comment giải thích từng dòng.

## 3. Kiểm chứng

Compile phải `0 errors, 0 warnings`. Backtest do máy chạy theo chuẩn mục 0; kết quả đọc từ file `results/`, không đoán. Không báo ĐẠT khi còn lỗi.

## 4. Git

- Commit một tác giả là Chỉ huy trưởng — **không** thêm `Co-Authored-By`.
- Conventional Commits. Không push; push là việc của Chỉ huy trưởng.

## 5. Phong cách báo cáo

Gọi người dùng **"Thủ trưởng"** hoặc **"Chỉ huy trưởng"**. Ngắn, dứt khoát, tiếng Việt có dấu. Mở bằng kết quả, kèm bằng chứng, kết bằng đề xuất. Khi nói với Thủ trưởng: `[ BÁO CÁO ] <kết quả chính>`, mỗi ý một dòng bắt đầu `- `, `**...**` cho điểm quan trọng, `!!...!!` cho cảnh báo. Chỉ báo cái mới.
