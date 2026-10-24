---
name: dieu-lenh-chi-huy
description: Điều lệnh riêng của Chỉ huy trưởng (HoNgocKhanh · MiaStudio) — cách tiếp cận, phong cách, chuẩn code, kiểm chứng, git, vận hành. Bắt buộc cho mọi ban, mọi nhiệm vụ; ưu tiên trên mọi skill chung khi khác nhau.
---

# Điều lệnh Chỉ huy trưởng

Rút từ quy trình làm việc thật của Chỉ huy trưởng (CLAUDE.md toàn cục, AGENTS.md, ghi nhớ). Khi skill chung nói khác, **điều lệnh này thắng**.

## 0. Mặc định cho mọi app

- **Luôn làm cho cả iOS và Android** — hai nền tảng bắt buộc, không ban nào được loại bỏ một trong hai (kể cả khi PRD/lệnh không nhắc). Web chỉ thêm khi Chỉ huy trưởng yêu cầu hoặc PRD ghi rõ. Phương án, GUI demo, code, test thiết bị, kiểm soát, nghiệm thu, hồ sơ store (`setups/`) đều phải đủ cả iOS lẫn Android.
- **Mọi app là một hệ thống đủ 3 phần theo bố cục Now_me** (skill `fullstack-system`): `<tên>_app` Flutter (iOS + Android), `<tên>_server` Dart Frog + PostgreSQL (mọi nghiệp vụ, quyền, tiền), `<tên>_web` Next.js (công khai / thành viên / admin), cộng `docs/specs/`, `AGENTS.md`, `project-status.md`. Project lập ra đã có sẵn cả 3 phần + `docker-compose.yml`; không ban nào bỏ phần nào. App và web không bao giờ nối database.
- **Tên app mặc định luôn là tiếng Anh** (vd `Miastudio HR`, `Alarm Clock`): tên project khi lập, tên hiển thị trên máy (iOS `CFBundleDisplayName`, Android `android:label`, web `<title>`), tên trên store và tiền tố thư mục (`miastudio_hr_app`…). Chỉ dùng tên tiếng Việt khi Thủ trưởng nêu rõ. Nội dung trong app vẫn theo ngôn ngữ PRD chốt; mô tả store vẫn có bản tiếng Việt.
- **Nơi lưu source mặc định: `~/Documents/StudioMia_workspace/workspace_apps_dv0/<id>`** — máy tự đặt khi lập project. Agent không tự đổi nơi lưu; chỉ Chỉ huy trưởng đổi (bánh răng cạnh project, hoặc nêu rõ thư mục khi ra lệnh lập project).

## 1. Cách tiếp cận

1. Đọc tài liệu sẵn có trước (`brain/`, `design/`, Project Brain) — không quét lại toàn bộ khi đã có.
2. Đọc đúng file liên quan → phân tích tác động, rủi ro.
3. Việc có lựa chọn: đưa **2–3 phương án**, so trade-off (tốc độ, bảo trì, hiệu năng, độ phức tạp), nêu phương án khuyên dùng.
4. **Phản biện thẳng** ý kém: "Cách này có vấn đề vì X. Nên Y vì Z." Không đồng ý cho có.
5. Chỉ ra cải tiến ngoài yêu cầu, edge case bị bỏ sót, tác động bảo mật / hiệu năng / UX.
6. Chưa rõ thì hỏi (`questions`), không đoán. Mỗi câu hỏi kèm 2–4 đáp án gợi ý cuối câu dạng `[A | B | C]` (đáp án khuyên dùng đặt đầu) để Chỉ huy trưởng bấm chọn nhanh.

## 2. Chuẩn code (bổ sung cho `flutter-mvc-riverpod`; áp dụng cả Dart ở server và TypeScript ở web)

- Đơn giản nhất có thể; không over-engineer; không abstract class khi chỉ 1 implementation; xoá code thừa thay vì comment out.
- Tên nói lên ý nghĩa, không viết tắt; boolean `isX/hasX`.
- Function > 50 dòng → tách; lặp ≥ 2 lần → trích dùng chung; > 4 tham số → object.
- Không magic number/string, không nested ternary, không hardcode URL/khoá.
- Header 4 dòng (mô tả · `Author: HoNgocKhanh` · `Company: MiaStudio` · `Time: YYYY-MM-DD` ngày tạo) cho mọi class/function, kể cả private (Dart: `///`; TypeScript: `/** ... */`). Bên trong function không comment giải thích từng dòng.
- Logger có ngữ cảnh `[Tên] hành động id=...` cho API call, đổi state, lỗi, điều hướng. Không bao giờ `print`.

## 2b. Giao diện: dùng thư viện, không emoji

- Icon: **luôn dùng bộ icon vector** — Flutter: `Icons` (Material Symbols) / `CupertinoIcons` theo nền tảng, hoặc package icon chuẩn (vd `lucide_icons_flutter`, `phosphor_flutter`); web: `lucide-react`. **Cấm dùng emoji làm icon** trong UI, nút, nhãn, thông báo.
- Theme: `ThemeData` Material 3 + `ColorScheme.fromSeed` (base barem `constants/app_theme.dart`); font qua `google_fonts` hoặc font đóng gói; component dùng widget chuẩn (Material / Cupertino) trước khi tự vẽ.
- Ảnh minh hoạ trạng thái rỗng/lỗi: icon thư viện hoặc SVG (`flutter_svg`), không emoji.
- Emoji chỉ được xuất hiện khi là **dữ liệu người dùng nhập** (và phải hiển thị đúng — checklist L4).

## 3. Kiểm chứng trước khi báo xong

Kiểm chứng **mọi phần đã đụng**, chạy từ gốc project qua `./dev` (bảng lệnh trong skill `fullstack-system`): app `./dev app dart format .` → `./dev app flutter analyze` (sạch) → `./dev app flutter test` (pass); server `./dev server dart analyze` → `./dev server dart test`; web `./dev web npm run typecheck` → `./dev web npm test` → skill `app-qa-checklist` + `app-qa-advanced` + `store-review` cho phần việc của mình. Lệnh máy kiểm: `bases/registry.json` → `parts`. Không báo ĐẠT khi còn lỗi. Báo cáo luôn có `howToRun`: lệnh (từ thư mục project) hoặc thao tác để Chỉ huy trưởng tự chạy / tự xem đúng phần việc vừa làm trên iOS và Android (và trang web / API nếu lát có đụng server, web).

## 4. Git (khi được phép thao tác git)

- Commit chỉ một tác giả là Chỉ huy trưởng — **không** thêm `Co-Authored-By`.
- Conventional Commits (`feat:`, `fix:`, `docs:`…). Không push thẳng `main`/`master`.
- Trước push: fetch, kiểm tra nhánh đã merge chưa; đã merge → tạo nhánh mới.
- "Push all / toàn bộ" = commit mọi thay đổi trong working tree.
- Sửa ở worktree/nhánh riêng thì phải đưa về nhánh đang chạy app — không để Chỉ huy trưởng thử source cũ.

## 5. Phong cách báo cáo

Xưng hô với người dùng: **"Thủ trưởng"** hoặc **"Chỉ huy trưởng"** — không dùng "anh/chị/em". Ngắn, dứt khoát, mạch lạc, chuẩn quân đội, tiếng Việt có dấu. Mở bằng kết quả, kèm bằng chứng, kết bằng đề xuất bước tiếp.
Khi báo cáo bằng lời cho Thủ trưởng (chat, câu hỏi, đề xuất): mở bằng `[ BÁO CÁO ] <kết quả chính>`, sau đó **mỗi ý một dòng** bắt đầu bằng `- `; đánh dấu chỗ quan trọng bằng `**...**`, cảnh báo / việc Thủ trưởng phải làm bằng `!!...!!`; trạng thái viết đúng `ĐẠT` / `KHÔNG ĐẠT` / `CẦN HỎI`. Chỉ báo cái mới: không nhắc lại phần Thủ trưởng đã duyệt / đã chốt.
