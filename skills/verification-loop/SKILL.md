---
name: verification-loop
description: Kiểm chứng công việc trước khi báo xong — format, analyze, test, soát diff, quét bảo mật, đối chiếu tiêu chí chấp nhận, ra kết luận PASS/FAIL có bằng chứng. Dùng cho QA và cho dev trước khi kết thúc task.
---

# Vòng kiểm chứng

Rút gọn từ `verification-loop` của ECC (MIT).

| Bước | Lệnh / việc | Đạt khi |
|---|---|---|
| 1. Format | `dart format --output=none --set-exit-if-changed .` | exit 0 |
| 2. Analyze | `flutter analyze` | "No issues found" |
| 3. Test | `flutter test` | tất cả pass, ghi số test |
| 4. Soát diff | `git diff HEAD~1 --stat`, đọc từng file đổi | không có code thừa, debug, TODO bỏ quên |
| 5. Bảo mật | tìm `print(`, URL/khoá hardcode, `!` bừa bãi, đường dẫn từ input người dùng | không có |
| 6. Tiêu chí | đối chiếu từng tiêu chí trong `prd.md` / `plan.md` | mỗi tiêu chí có bằng chứng |

## Quy tắc báo cáo

- Mỗi kết luận kèm bằng chứng: lệnh đã chạy + trích kết quả, hoặc `file:dòng`.
- Không chạy được một bước thì ghi rõ "chưa kiểm chứng" và lý do — không được coi là đạt.
- Một bước FAIL ⇒ kết luận chung FAIL.
