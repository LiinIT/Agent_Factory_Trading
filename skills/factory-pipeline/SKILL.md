---
name: factory-pipeline
description: Trình tự chiến dịch của đơn vị dev ảo — từ lệnh của Chỉ huy trưởng tới app MVP qua phương án tác chiến, GUI demo, công binh, lát cắt, kiểm soát, nghiệm thu với 3 điểm duyệt. Dùng khi lập kế hoạch, giao nhiệm vụ, hoặc xác định bước tiếp theo.
---

# Trình tự chiến dịch

Rút gọn từ `orch-pipeline` / `orch-build-mvp` của ECC (MIT): làm có cổng duyệt, không tự quyết hướng đi.

```
Lệnh Chỉ huy trưởng ─▶ Tham mưu trưởng hỏi lại (≤3 câu)
 ─▶ Ban Tác chiến: brain/prd.md ...................... ⏸ DUYỆT 1 (phương án)
 ─▶ Ban Ngoại giao: design/prototype/ (iPhone·Android·Web)  ⏸ DUYỆT 2 (GUI demo) — chưa duyệt: cấm viết code
 ─▶ Ban Công binh: architecture.md + plan.md (Tham mưu trưởng soát)
 ─▶ Đại đội Xung kích lát 1 ─▶ Ban Kiểm soát ─▶ lát 2 ─▶ … 
 ─▶ Hội đồng Nghiệm thu: brain/review.md ............. ⏸ DUYỆT 3 (bàn giao)
 ─▶ Ban Ngoại giao: hồ sơ cửa hàng (setups/)
 ─▶ Ban Hậu cần: báo cáo tổng thiệt hại
```

## Nguyên tắc

- **Lát cắt dọc mỏng**: lát 1 chạy được từ đầu đến cuối trên cả 3 nền tảng; mỗi lát đi xuyên suốt server → app → web (skill `fullstack-system`).
- **Tài liệu là cầu nối**: mọi bàn giao nằm trong `brain/`, `design/` và `setups/`; ban sau đọc file, không đoán.
- **Mọi ban báo cáo Tham mưu trưởng** khi kết thúc (báo cáo JSON). Việc thường lệ đã có trong kế hoạch được Ban Thông tin tự chuyển; Tham mưu trưởng chỉ quyết khi: qua cổng duyệt, `KHÔNG ĐẠT`, lỗi, hết nhiệm vụ trong hàng.
- **Chỉ huy trưởng duyệt hướng đi**; câu hỏi `CẦN HỎI` chờ Chỉ huy trưởng trả lời rồi mới làm tiếp.
- Bị trả lại kèm phản hồi → làm lại đúng phản hồi đó, không mở rộng phạm vi.

## Thư mục tài liệu

| File | Ban | Nội dung |
|---|---|---|
| `brain/brief.md` | hệ thống | lệnh gốc của Chỉ huy trưởng |
| `brain/prd.md` | Tác chiến | phạm vi, tiêu chí ĐẠT, ma trận thiết bị, câu hỏi mở |
| `design/prototype/index.html` | Ngoại giao | GUI demo bấm được, chuyển iPhone/Android/Web |
| `design/README.md` | Ngoại giao | danh sách màn hình, luồng, khác biệt nền tảng |
| `brain/architecture.md` | Công binh | stack, tính năng app, bảng database + migration, danh sách API, trang web, rủi ro |
| `brain/plan.md` | Công binh | lát cắt + kết quả mong muốn + cách thử |
| `docs/specs/*.md` | Công binh | đặc tả từng tính năng: luồng, API, bảng, lỗi |
| `project-status.md` | Xung kích | tiến độ tính năng (đánh dấu khi xong lát) |
| `brain/qa/*.md` | Kiểm soát | bảng thiết bị × tiêu chí |
| `brain/review.md` | Nghiệm thu | kết luận bàn giao |
| `setups/` | Ngoại giao (Chỉ huy trưởng làm phần trên store) | hồ sơ lên store: listing, ảnh chụp, icon, nháp App Privacy / Data safety / chính sách quyền riêng tư, ghi chú người duyệt, `store-tasks.md` việc phải làm trên App Store Connect / Play Console |
| `brain/checklist.md` | Kiểm soát, Nghiệm thu | barem xuất xưởng — phải ĐẠT 100% |
| `brain/lessons.md` | mọi ban | bài học — chỉ ghi thêm |
