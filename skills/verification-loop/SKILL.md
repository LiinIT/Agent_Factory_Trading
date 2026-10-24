---
name: verification-loop
description: Kiểm chứng công việc EA trước khi báo xong — compile, soát diff, soát logic giao dịch, đối chiếu tiêu chí, kết luận PASS/FAIL có bằng chứng.
---

# Vòng kiểm chứng (EA)

| Bước | Việc | Đạt khi |
|---|---|---|
| 1. Compile | Máy chạy MetaEditor | `0 errors, 0 warnings` |
| 2. Soát diff | `git diff HEAD~1 --stat`, đọc từng file đổi | không code thừa, debug, TODO bỏ quên; version đã nâng + changelog + BUILD |
| 3. Soát logic giao dịch | Đối chiếu danh sách trong skill `mql5-ea` | từng mục có bằng chứng `file:dòng` |
| 4. Bẫy đã biết | Đối chiếu `brain-ea/pitfalls/` | không mắc bẫy nào |
| 5. Tiêu chí | Đối chiếu `brain/hypothesis.md` và `brain/design.md` | mỗi tiêu chí có bằng chứng |

## Quy tắc báo cáo

- Mỗi kết luận kèm bằng chứng: lệnh/log đã đọc + trích kết quả, hoặc `file:dòng`.
- Không kiểm được một bước thì ghi "chưa kiểm chứng" và lý do — không được coi là đạt.
- Một bước FAIL ⇒ kết luận chung FAIL.
