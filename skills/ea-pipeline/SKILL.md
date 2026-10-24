---
name: ea-pipeline
description: Trình tự chiến dịch của DV2 — từ ý tưởng tới kết luận nghiệm thu một bot EA, gồm các cổng duyệt, vòng sửa lỗi và quy tắc "bác bỏ chứ không tinh chỉnh". Dùng khi lập kế hoạch, giao nhiệm vụ, hoặc xác định bước tiếp theo.
---

# Trình tự chiến dịch DV2

```
(trinh-sat → mo-xe) ─┐
Ý tưởng của Chỉ huy ─┴▶ ea-nghien-cuu: brain/hypothesis.md .... ⏸ DUYỆT 1 (giả thuyết + tiêu chí bác bỏ)
 ─▶ ea-thiet-ke: brain/design.md (Tham mưu trưởng soát)
 ─▶ ea-che-tao: ea/<tên>.mq5 (compile sạch)  ⇄  ea-soat-ma (KHÔNG ĐẠT → vòng sửa, tối đa 5)
 ─▶ ea-dung-ban-thu (máy): results/<run>.ini     ─▶ ea-thu-nghiem (máy): results/<run>.json
 ─▶ ea-phan-tich: brain/analysis.md (chỉ số, KHÔNG kết luận)
 ─▶ ea-phan-bien: brain/verdict.md (ĐẠT/KHÔNG ĐẠT theo tiêu chí bước 1)
 ─▶ ea-nghiem-thu: brain/review.md ......................... ⏸ DUYỆT 2 (bỏ hay lên demo)
 ─▶ ea-ghi-nho (cập nhật bộ não) ─▶ ea-bao-cao (hồ sơ mạnh/yếu + báo cáo HTML)
```

## Nguyên tắc

- **KHÔNG ĐẠT ở `ea-phan-bien` không quay về `ea-che-tao` để chỉnh tham số.** Quay về `ea-nghien-cuu` để bác bỏ ý tưởng hoặc sửa giả thuyết. Chỉnh tham số tới khi đẹp là cách tạo overfit.
- **Tiêu chí bác bỏ đặt TRƯỚC khi test** (ở `brain/hypothesis.md`), không đặt lại sau khi thấy số.
- **Ngân sách chạy tester**: tối đa số lần chạy mỗi EA mỗi vòng ghi trong `config/factory.json` (`ea.maxTesterRunsPerRound`). Hết ngân sách thì dừng, xin lệnh.
- **Tài liệu là cầu nối**: ban sau đọc file, không đoán.
- Mọi ban báo cáo Tham mưu trưởng khi kết thúc; việc thường lệ Ban Thông tin tự chuyển.
- Ghi nhớ chạy cả khi KHÔNG ĐẠT: thất bại cũng là kiến thức.

## Tài liệu

| File | Ban |
|---|---|
| `brain/brief.md` | hệ thống |
| `brain/hypothesis.md` | ea-nghien-cuu |
| `brain/design.md` | ea-thiet-ke |
| `ea/<tên>.mq5` | ea-che-tao |
| `brain/code-review.md` | ea-soat-ma |
| `results/<run>.ini` · `results/<run>.json` | máy (dung-ban-thu / thu-nghiem) |
| `brain/analysis.md` | ea-phan-tich |
| `brain/verdict.md` | ea-phan-bien |
| `brain/review.md` | ea-nghiem-thu |
| `reports/*.html` | ea-bao-cao |
| `brain/lessons.md` | mọi ban (chỉ ghi thêm) |
