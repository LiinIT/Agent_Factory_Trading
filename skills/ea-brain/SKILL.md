---
name: ea-brain
description: Cách đọc và ghi bộ não EA (brain-ea/) trong DV2 — lược đồ, luật ghi, vòng đời kiến thức, ai được ghi gì. Dùng cho mọi ban đọc hoặc ghi não.
---

# Bộ não EA

Trong project, bộ não chung nằm ở `brain-ea/` (liên kết tới `brain/ea/` của DV2). Đọc `brain-ea/README.md` trước.

## Đọc (trước khi làm)
- `ea-nghien-cuu`, `ea-thiet-ke`: `hypotheses/`, `algorithms/`, `bots/index.md` — đừng thử lại điều đã bác bỏ.
- `ea-che-tao`: `patterns/`. `ea-soat-ma`, `ea-dung-ban-thu`, `ea-thu-nghiem`: `pitfalls/`.
- `ea-mo-xe`: `scouting/`.

## Ghi (chỉ `ea-ghi-nho` và `ea-trinh-sat` / `ea-mo-xe` trong kho của họ)
1. Mỗi mục một file, front-matter theo `_templates/`, tối đa ~40 dòng thân.
2. Không có `evidence` ⇒ `confidence: chua-kiem-chung`, không ghi điểm mạnh/yếu.
3. Chỉ `ea-phan-bien` nâng `confidence` lên `da-backtest`.
4. Mục mới đảo ngược mục cũ: giữ mục cũ, thêm `superseded_by` / `supersedes`.
5. Ghi điều kiện thử cho mọi kết luận.
6. Ghi cả khi KHÔNG ĐẠT.
7. Kiểm trùng bằng Grep trước khi tạo mục mới; trùng thì cập nhật mục cũ.
