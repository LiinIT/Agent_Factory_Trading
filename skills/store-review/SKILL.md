---
name: store-review
description: Điều kiện để qua Apple App Review và Google Play review — quyền riêng tư, quyền truy cập, tài khoản, nội dung, build, chính sách SDK — kèm mục máy tự kiểm (scripts/store_check). Dùng khi lập phương án (đưa yêu cầu vào PRD từ đầu), khi kiểm soát và nghiệm thu trước bàn giao.
---

# Store review — Apple & Google

**Cập nhật: 2026-10-17.** Chính sách hai cửa hàng thay đổi thường xuyên: trước khi nộp thật, Hội đồng Nghiệm thu phải đối chiếu lại với
App Store Review Guidelines (developer.apple.com/app-store/review/guidelines) và Play Console Policy Center. Không cửa hàng nào bảo đảm duyệt 100% — mục tiêu là **không vướng lý do từ chối đã biết**.

Nhãn: **[MÁY]** máy kiểm (`bases/.../tool/store_check.dart`) · **[AI]** soát code/cấu hình · **[THỦ TRƯỞNG]** việc cần tài khoản developer / người làm.

## A. Chung cho cả hai

| # | Điều kiện | Kiểm |
|---|---|---|
| S1 | App chạy ổn định, không crash, không màn hình trắng, mọi nút có hành động (checklist `app-qa-checklist` ĐẠT 100%) | [MÁY] |
| S2 | Không nội dung mẫu: không "Lorem ipsum", "Sample", "TODO", ảnh giữ chỗ, mã `com.example` | [MÁY] |
| S3 | Có **chính sách quyền riêng tư** (URL công khai) và hiển thị trong app nếu thu thập dữ liệu | [AI] + [THỦ TRƯỞNG] |
| S4 | Chỉ xin quyền thật sự dùng, xin đúng lúc (khi người dùng chạm tính năng), từ chối quyền thì app vẫn chạy | [AI] |
| S5 | App có đăng ký tài khoản ⇒ **có xoá tài khoản ngay trong app** | [AI] |
| S6 | Có tài khoản demo + ghi chú cho người duyệt nếu app cần đăng nhập | [THỦ TRƯỞNG] |
| S7 | Không lộ khoá/secret trong code, chỉ dùng HTTPS | [MÁY] |

## B. Apple App Review

| # | Điều kiện | Kiểm |
|---|---|---|
| A1 | `ios/Runner/PrivacyInfo.xcprivacy` tồn tại, khai đúng loại dữ liệu và "required reason API" (UserDefaults, file timestamp, disk space…) mà app và SDK dùng | [MÁY] có file · [AI] nội dung |
| A2 | Mỗi quyền dùng có **câu giải thích tiếng Việt cụ thể** trong `Info.plist` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSMicrophoneUsageDescription`…) | [MÁY] |
| A3 | Đăng nhập bằng bên thứ ba (Google, Facebook…) ⇒ có thêm lựa chọn đăng nhập bảo vệ quyền riêng tư tương đương (Sign in with Apple) | [AI] |
| A4 | Mua nội dung số / tính năng ⇒ dùng In-App Purchase của Apple, có nút **Khôi phục giao dịch** | [AI] |
| A5 | Bundle ID thật (không `com.example`), version + build number hợp lệ, icon đủ cỡ (không alpha), launch screen | [MÁY] |
| A6 | Build release được: `flutter build ios --release --no-codesign` | [MÁY] |
| A7 | Hỗ trợ IPv6, giao diện đúng trên iPad nếu bật iPad (hoặc chỉ khai iPhone) | [AI] |
| A8 | Không nhắc tới nền tảng khác ("Android", "Google Play") trong giao diện/ảnh chụp iOS | [AI] |

## C. Google Play review

| # | Điều kiện | Kiểm |
|---|---|---|
| P1 | `targetSdk` đạt mức Play yêu cầu hiện hành (tháng 8 hằng năm nâng lên API mới nhất − 1; năm 2026: **API 36**) | [MÁY] |
| P2 | Nộp **AAB**: `flutter build appbundle --release` thành công | [MÁY] |
| P3 | Hỗ trợ **trang bộ nhớ 16 KB** (bắt buộc với app nhắm Android 15+ có thư viện native) — Flutter mới đã hỗ trợ; kiểm thư viện native bên thứ ba | [AI] |
| P4 | Form **Data safety** khớp dữ liệu thật app thu thập / chia sẻ | [THỦ TRƯỞNG] (AI soạn nháp) |
| P5 | Quyền nhạy cảm (SMS, call log, vị trí nền, `QUERY_ALL_PACKAGES`…) có khai báo và lý do; không xin nếu không bắt buộc | [MÁY] liệt kê · [AI] xét |
| P6 | `applicationId` thật, `versionCode` tăng dần, ký release bằng upload key (không ký debug) | [MÁY] + [THỦ TRƯỞNG] |
| P7 | Xếp loại nội dung (content rating) + nhóm đối tượng (nếu có trẻ em ⇒ chính sách Families) | [THỦ TRƯỞNG] |

## Áp dụng

- **Ban Tác chiến**: PRD có mục "Yêu cầu cửa hàng": quyền dùng, dữ liệu thu thập, có tài khoản không, có thanh toán không → suy ra A3/A4/S5 áp dụng hay không.
- **Đại đội Xung kích**: thêm câu giải thích quyền, PrivacyInfo, xoá tài khoản… ngay trong lát cắt có tính năng đó.
- **Ban Kiểm soát / Nghiệm thu**: chạy `dart run tool/store_check.dart` (máy kiểm các mục [MÁY]), điền `brain/checklist.md` phần Store; mục [THỦ TRƯỞNG] liệt kê thành danh sách việc cần Thủ trưởng làm.
- **Ban Ngoại giao**: soạn hồ sơ lên store trong `setups/` (listing, ảnh chụp, icon, nháp quyền riêng tư, ghi chú người duyệt); việc trên App Store Connect / Play Console nằm ở `setups/store-tasks.md`.
