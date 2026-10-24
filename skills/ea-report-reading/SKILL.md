---
name: ea-report-reading
description: Cách đọc số liệu `results/*.json` và lập hồ sơ mạnh/yếu, báo cáo từng bot và so sánh nhiều bot — cho ea-phan-tich và ea-bao-cao.
---

# Đọc số liệu và lập báo cáo

## ea-phan-tich (chỉ số, KHÔNG kết luận)
Từ `results/*.json` trích: lợi nhuận ròng, PF, số lệnh, win rate, lãi/lỗ trung bình, DD tối đa (USD và % của 1000), chuỗi thua dài nhất, margin level thấp nhất, tổng lot lớn nhất, kết quả theo tháng và theo giờ, ảnh hưởng spread/trượt giá, cháy tài khoản (ngày). Ghi điều kiện thử của từng lần chạy. Lần chạy `valid:false` không dùng.
Cấm dùng các từ phán xét ("tốt", "xấu", "ĐẠT"): đó là việc của `ea-phan-bien`.

## ea-bao-cao
- **Hồ sơ bot** `brain-ea/bots/<ea>/profile.md` theo mẫu `_templates/bot-profile.md`. Mỗi điểm mạnh/yếu có số liệu và nguồn (`results/<run>.json`); không có số liệu thì không ghi.
- **Báo cáo từng bot** `reports/<ea>-<ngày>.html`: tự chứa, có đường vốn, lợi nhuận theo tháng và theo giờ, bảng mạnh/yếu, kết luận.
- **Báo cáo so sánh**: chỉ so sánh bot cùng vốn, giai đoạn, model tick, mô hình trễ; khác điều kiện ⇒ nhãn "không so sánh trực tiếp", không xếp hạng.
- Điểm yếu phải được tìm chủ động từ kịch bản căng của `ea-phan-bien`, không chỉ ghi những gì report tình cờ cho thấy.
